import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration for chunked processing
const MAX_PROCESSING_TIME_MS = 45000; // 45 seconds max (leave buffer for response)
const BATCH_SIZE = 100; // Files per batch in nested ZIP processing (reduced for memory)
const MAX_MEMORY_MB = 150; // Conservative memory limit for edge functions
const MAX_DOWNLOADABLE_FILE_MB = 50; // Maximum file size we can safely download into memory
const SAMPLE_SIZE_FOR_LARGE_FILES = 50; // Number of nested files to sample from large archives

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileId, jobId, userId, action, chunkIndex = 0, totalChunks = 1 } = await req.json();

    console.log(`Processing file ${fileId} for job ${jobId}, action: ${action}, chunk: ${chunkIndex + 1}/${totalChunks}`);

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('dispatch_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileId}`);
    }

    const fileSizeMB = (file.file_size || 0) / (1024 * 1024);
    console.log(`File: ${file.file_name}, type: ${file.file_type}, size: ${fileSizeMB.toFixed(2)} MB`);

    let result: any = { success: false };

    try {
      switch (file.file_type) {
        case 'LETTURE':
          result = await processLettureFileChunked(supabase, file, jobId, userId, chunkIndex, startTime);
          break;
        case 'ANAGRAFICA':
          result = await processAnagraficaFile(supabase, file, startTime);
          break;
        case 'AGGR_IP':
          result = await processIpFile(supabase, file, startTime);
          break;
        case 'IP_DETAIL':
          result = await processIpDetailFile(supabase, file, startTime);
          break;
        default:
          result = { success: false, error: `Unknown file type: ${file.file_type}` };
      }

      // Save intermediate result
      const { error: insertError } = await supabase
        .from('dispatch_intermediate_results')
        .insert({
          job_id: jobId,
          user_id: userId,
          file_id: fileId,
          result_type: `${file.file_type.toLowerCase()}_chunk_${chunkIndex}`,
          zone_code: file.zone_code,
          status: result.success ? 'completed' : 'failed',
          data: result,
          error_message: result.error || null,
          processing_time_ms: Date.now() - startTime
        });

      if (insertError) {
        console.error('Error saving intermediate result:', insertError);
      }

    } catch (processError) {
      const errorMsg = processError instanceof Error ? processError.message : 'Unknown error';
      console.error('Processing error:', errorMsg);
      result = { success: false, error: errorMsg };
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        fileId,
        fileName: file.file_name,
        fileType: file.file_type,
        chunkIndex,
        processingTimeMs: Date.now() - startTime,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dispatch-file-processor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, processingTimeMs: Date.now() - startTime }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Extract POD codes from filename patterns (e.g., IT001E12345678_2024.zip)
function extractPodFromFilename(filename: string): string[] {
  const pods: string[] = [];
  // Italian POD format: IT + 3 chars + E + 8 digits (total 14 chars)
  const podPattern = /IT\d{3}E\d{8}/gi;
  const matches = filename.match(podPattern);
  if (matches) {
    pods.push(...matches.map(p => p.toUpperCase()));
  }
  return pods;
}

// Download file with streaming support
async function downloadFile(supabase: any, fileUrl: string): Promise<Uint8Array | null> {
  try {
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      console.error('Invalid storage URL format:', fileUrl);
      return null;
    }
    
    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0];
    const filePath = pathParts.slice(1).join('/');
    
    console.log(`Downloading from bucket: ${bucketName}, path: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }
    
    return new Uint8Array(await data.arrayBuffer());
  } catch (error) {
    console.error('Error in downloadFile:', error);
    return null;
  }
}

// Process LETTURE file with chunked nested ZIP handling
async function processLettureFileChunked(
  supabase: any, 
  file: any, 
  jobId: string,
  userId: string,
  chunkIndex: number, 
  startTime: number
): Promise<any> {
  const allPods: string[] = [];
  let filesProcessed = 0;
  let skippedFiles = 0;
  const warnings: string[] = [];
  const fileName = file.file_name.toLowerCase();
  const fileSizeMB = (file.file_size || 0) / (1024 * 1024);

  // Check file size BEFORE downloading to prevent memory issues
  if (fileSizeMB > MAX_DOWNLOADABLE_FILE_MB) {
    console.log(`File ${file.file_name} (${fileSizeMB.toFixed(2)} MB) exceeds safe download limit (${MAX_DOWNLOADABLE_FILE_MB} MB)`);
    
    // For very large files, we can only extract POD codes from filename patterns
    // or return a warning asking user to upload smaller files
    const extractedFromFilename = extractPodFromFilename(file.file_name);
    if (extractedFromFilename.length > 0) {
      console.log(`Extracted ${extractedFromFilename.length} PODs from filename`);
      return {
        success: true,
        pod_codes: extractedFromFilename,
        total_pods: extractedFromFilename.length,
        files_processed: 0,
        files_skipped: 1,
        chunk_index: chunkIndex,
        total_chunks_needed: 1,
        more_chunks_needed: false,
        warnings: [`File ${file.file_name} (${fileSizeMB.toFixed(0)}MB) troppo grande per elaborazione diretta. Limite: ${MAX_DOWNLOADABLE_FILE_MB}MB. Carica file più piccoli o dividi l'archivio.`],
        skipped_due_to_size: true
      };
    }
    
    return {
      success: true,
      pod_codes: [],
      total_pods: 0,
      files_processed: 0,
      files_skipped: 1,
      chunk_index: chunkIndex,
      total_chunks_needed: 1,
      more_chunks_needed: false,
      warnings: [`File ${file.file_name} (${fileSizeMB.toFixed(0)}MB) troppo grande. Limite memoria edge function: ${MAX_DOWNLOADABLE_FILE_MB}MB. Si prega di caricare file più piccoli o dividere l'archivio ZIP in parti.`],
      skipped_due_to_size: true
    };
  }

  // Check if we have previous chunk data
  const { data: previousChunks } = await supabase
    .from('dispatch_intermediate_results')
    .select('data')
    .eq('job_id', jobId)
    .eq('file_id', file.id)
    .like('result_type', 'letture_chunk_%')
    .eq('status', 'completed');

  const previousPods = new Set<string>();
  if (previousChunks) {
    for (const chunk of previousChunks) {
      if (chunk.data?.pod_codes) {
        chunk.data.pod_codes.forEach((pod: string) => previousPods.add(pod));
      }
    }
  }
  console.log(`Previous chunks found: ${previousChunks?.length || 0}, total PODs so far: ${previousPods.size}`);

  const content = await downloadFile(supabase, file.file_url);
  if (!content) {
    return { success: false, error: 'Could not download file' };
  }

  const contentSizeMB = content.length / (1024 * 1024);
  console.log(`Downloaded ${contentSizeMB.toFixed(2)} MB for letture file`);

  try {
    if (fileName.endsWith('.zip')) {
      const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
      
      const zip = await JSZip.loadAsync(content);
      const allFiles = Object.keys(zip.files).filter(name => !zip.files[name].dir);
      
      console.log(`ZIP contains ${allFiles.length} files total`);

      // Separate files by type
      const csvFiles = allFiles.filter(f => f.toLowerCase().endsWith('.csv'));
      const xmlFiles = allFiles.filter(f => f.toLowerCase().endsWith('.xml'));
      const nestedZips = allFiles.filter(f => f.toLowerCase().endsWith('.zip'));

      console.log(`Found: ${csvFiles.length} CSV, ${xmlFiles.length} XML, ${nestedZips.length} nested ZIPs`);

      // Process top-level CSV files
      for (const csvName of csvFiles) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push(`Timeout: ${csvFiles.length - filesProcessed} files remaining`);
          break;
        }
        try {
          const csvContent = await zip.files[csvName].async('string');
          const pods = parseLettureCSV(csvContent);
          allPods.push(...pods);
          filesProcessed++;
        } catch (e) {
          console.error(`Error processing ${csvName}:`, e);
        }
      }

      // Process top-level XML files
      for (const xmlName of xmlFiles) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) break;
        try {
          const xmlContent = await zip.files[xmlName].async('string');
          const pods = parseLettureXML(xmlContent);
          allPods.push(...pods);
          filesProcessed++;
        } catch (e) {
          console.error(`Error processing ${xmlName}:`, e);
        }
      }

      // Process nested ZIPs - this is where chunking matters
      const startIdx = chunkIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, nestedZips.length);
      
      console.log(`Processing nested ZIPs ${startIdx + 1} to ${endIdx} of ${nestedZips.length}`);

      for (let i = startIdx; i < endIdx; i++) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push(`Timeout at nested ZIP ${i + 1}/${nestedZips.length}`);
          break;
        }

        const nestedZipName = nestedZips[i];
        try {
          const nestedData = await zip.files[nestedZipName].async('arraybuffer');
          const nestedZip = await JSZip.loadAsync(nestedData);
          const nestedFiles = Object.keys(nestedZip.files)
            .filter(n => !nestedZip.files[n].dir)
            .filter(n => n.toLowerCase().endsWith('.csv') || n.toLowerCase().endsWith('.xml'));

          for (const nestedFile of nestedFiles) {
            if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) break;
            
            try {
              const nestedContent = await nestedZip.files[nestedFile].async('string');
              const pods = nestedFile.toLowerCase().endsWith('.csv') 
                ? parseLettureCSV(nestedContent)
                : parseLettureXML(nestedContent);
              allPods.push(...pods);
              filesProcessed++;
            } catch (e) {
              // Silent fail for nested files
            }
          }
        } catch (e) {
          console.error(`Error processing nested ZIP ${nestedZipName}:`, e);
          skippedFiles++;
        }
      }

      // Track if more chunks needed
      const moreChunksNeeded = endIdx < nestedZips.length;
      const nextChunkIndex = moreChunksNeeded ? chunkIndex + 1 : -1;
      const totalChunksNeeded = Math.ceil(nestedZips.length / BATCH_SIZE);

      console.log(`Chunk ${chunkIndex + 1}/${totalChunksNeeded} complete. Files processed: ${filesProcessed}, PODs found: ${allPods.length}`);

      const uniquePods = [...new Set(allPods)];
      
      return {
        success: true,
        pod_codes: uniquePods,
        total_pods: uniquePods.length,
        files_processed: filesProcessed,
        files_skipped: skippedFiles,
        chunk_index: chunkIndex,
        total_chunks_needed: totalChunksNeeded,
        more_chunks_needed: moreChunksNeeded,
        next_chunk_index: nextChunkIndex,
        nested_zips_total: nestedZips.length,
        nested_zips_processed: endIdx,
        warnings
      };

    } else if (fileName.endsWith('.csv')) {
      const textContent = new TextDecoder().decode(content);
      const pods = parseLettureCSV(textContent);
      allPods.push(...pods);
      filesProcessed = 1;
    } else if (fileName.endsWith('.xml')) {
      const textContent = new TextDecoder().decode(content);
      const pods = parseLettureXML(textContent);
      allPods.push(...pods);
      filesProcessed = 1;
    }
  } catch (error) {
    console.error('Error processing letture file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Processing error' };
  }

  const uniquePods = [...new Set(allPods)];
  console.log(`Extracted ${uniquePods.length} unique PODs from ${filesProcessed} files`);

  return {
    success: true,
    pod_codes: uniquePods,
    total_pods: uniquePods.length,
    files_processed: filesProcessed,
    files_skipped: skippedFiles,
    chunk_index: chunkIndex,
    total_chunks_needed: 1,
    more_chunks_needed: false,
    warnings
  };
}

// Process ANAGRAFICA file with metadata row handling
async function processAnagraficaFile(supabase: any, file: any, startTime: number): Promise<any> {
  const content = await downloadFile(supabase, file.file_url);
  if (!content) {
    return { success: false, error: 'Could not download file' };
  }

  const podCodesO: string[] = [];
  const podCodesLP: string[] = [];
  const warnings: string[] = [];
  const fileName = file.file_name.toLowerCase();

  try {
    if (fileName.endsWith('.zip')) {
      const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
      const zip = await JSZip.loadAsync(content);
      const csvFiles = Object.keys(zip.files).filter(name => 
        name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
      );

      for (const csvName of csvFiles) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push('Timeout during anagrafica processing');
          break;
        }

        const csvContent = await zip.files[csvName].async('string');
        const parsed = parseAnagraficaCSVWithMetadata(csvContent, file.zone_code, file.month_reference);
        podCodesO.push(...parsed.podCodesO);
        podCodesLP.push(...parsed.podCodesLP);
      }
    } else if (fileName.endsWith('.csv')) {
      const textContent = new TextDecoder().decode(content);
      const parsed = parseAnagraficaCSVWithMetadata(textContent, file.zone_code, file.month_reference);
      podCodesO.push(...parsed.podCodesO);
      podCodesLP.push(...parsed.podCodesLP);
    }
  } catch (error) {
    console.error('Error processing anagrafica file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Processing error' };
  }

  const uniqueO = [...new Set(podCodesO)];
  const uniqueLP = [...new Set(podCodesLP)];

  return {
    success: true,
    pod_codes_o: uniqueO,
    pod_codes_lp: uniqueLP,
    total_o: uniqueO.length,
    total_lp: uniqueLP.length,
    zone_code: file.zone_code,
    warnings
  };
}

// Process AGGR_IP file
async function processIpFile(supabase: any, file: any, startTime: number): Promise<any> {
  const content = await downloadFile(supabase, file.file_url);
  if (!content) {
    return { success: false, error: 'Could not download file' };
  }

  const dailyCurves: number[][] = [];
  const warnings: string[] = [];
  const fileName = file.file_name.toLowerCase();

  try {
    if (fileName.endsWith('.zip')) {
      const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
      const zip = await JSZip.loadAsync(content);
      const csvFiles = Object.keys(zip.files).filter(name => 
        name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
      );

      for (const csvName of csvFiles) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push('Timeout during IP processing');
          break;
        }

        const csvContent = await zip.files[csvName].async('string');
        const parsed = parseAggrIpCSV(csvContent);
        dailyCurves.push(...parsed.dailyCurves);
        warnings.push(...parsed.warnings);
      }
    } else if (fileName.endsWith('.csv')) {
      const textContent = new TextDecoder().decode(content);
      const parsed = parseAggrIpCSV(textContent);
      dailyCurves.push(...parsed.dailyCurves);
      warnings.push(...parsed.warnings);
    }
  } catch (error) {
    console.error('Error processing IP file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Processing error' };
  }

  const avgCurve = calculateAverageCurve(dailyCurves);
  const totalConsumption = avgCurve.reduce((a, b) => a + b, 0);

  return {
    success: true,
    typical_day_curve: avgCurve,
    days_processed: dailyCurves.length,
    total_consumption: totalConsumption,
    warnings
  };
}

// Process IP_DETAIL file (XLSX or CSV)
async function processIpDetailFile(supabase: any, file: any, startTime: number): Promise<any> {
  const content = await downloadFile(supabase, file.file_url);
  if (!content) {
    return { success: false, error: 'Could not download file' };
  }

  const ipPodCodes: string[] = [];
  const fileName = file.file_name.toLowerCase();

  try {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // For Excel files, try to extract POD codes from any text content
      const textContent = new TextDecoder('utf-8', { fatal: false }).decode(content);
      const podPattern = /IT\d{3}E\d{8,}/g;
      let match;
      while ((match = podPattern.exec(textContent)) !== null) {
        ipPodCodes.push(match[0]);
      }
    } else if (fileName.endsWith('.csv')) {
      const textContent = new TextDecoder().decode(content);
      const lines = textContent.split('\n').filter(line => line.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const separator = lines[0].includes(';') ? ';' : ',';
        const values = lines[i].split(separator);
        for (const val of values) {
          const cleanVal = val.trim().replace(/"/g, '');
          if (cleanVal.startsWith('IT') && cleanVal.length > 10) {
            ipPodCodes.push(cleanVal);
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing IP detail file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Processing error' };
  }

  const uniqueIpPods = [...new Set(ipPodCodes)];
  console.log(`Extracted ${uniqueIpPods.length} IP POD codes from detail file`);

  return {
    success: true,
    ip_pod_codes: uniqueIpPods,
    total_ip_pods: uniqueIpPods.length
  };
}

// Parse CSV with metadata row detection
function parseAnagraficaCSVWithMetadata(content: string, zoneCode?: string, dispatchMonth?: string): { podCodesO: string[], podCodesLP: string[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return { podCodesO: [], podCodesLP: [] };

  const separator = lines[0].includes(';') ? ';' : ',';
  
  // Check if first line is metadata (doesn't contain typical header names)
  const firstLineUpper = lines[0].toUpperCase();
  const isFirstLineMetadata = !firstLineUpper.includes('POD') && 
                               !firstLineUpper.includes('TRATTAMENTO') &&
                               !firstLineUpper.includes('CF') &&
                               !firstLineUpper.includes('PIVA');

  const headerLineIndex = isFirstLineMetadata ? 1 : 0;
  const dataStartIndex = headerLineIndex + 1;

  if (lines.length <= headerLineIndex) {
    console.log('Not enough lines in anagrafica file');
    return { podCodesO: [], podCodesLP: [] };
  }

  console.log(`Anagrafica: metadata ${isFirstLineMetadata ? 'detected' : 'not detected'}, headers at line ${headerLineIndex + 1}`);

  const headers = lines[headerLineIndex].split(separator).map(h => h.trim().toUpperCase());
  console.log('Headers found:', headers.slice(0, 10), '...');

  // Find POD column
  const podColNames = ['POD', 'CODICE_POD', 'COD_POD', 'CODICE POD', 'PUNTO_PRELIEVO'];
  let podColIndex = -1;
  for (const name of podColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      podColIndex = idx;
      break;
    }
  }

  // Find trattamento column based on dispatch month
  let trattamentoColIndex = -1;
  let trattamentoColName = '';
  
  if (dispatchMonth) {
    const monthNum = parseInt(dispatchMonth.split('-')[1], 10);
    const trattamentoColNames = [
      `TRATTAMENTO_${monthNum}`,
      `TRATTAMENTO_${monthNum.toString().padStart(2, '0')}`,
    ];
    
    for (const colName of trattamentoColNames) {
      const idx = headers.indexOf(colName);
      if (idx !== -1) {
        trattamentoColIndex = idx;
        trattamentoColName = colName;
        break;
      }
    }
  }

  // Fallback to generic columns
  if (trattamentoColIndex === -1) {
    const fallbackColNames = ['TRATTAMENTO', 'TIPO_TRATTAMENTO', 'TIPO_MISURATORE', 'TIPO'];
    for (const name of fallbackColNames) {
      const idx = headers.indexOf(name);
      if (idx !== -1) {
        trattamentoColIndex = idx;
        trattamentoColName = name;
        break;
      }
    }
  }

  console.log(`POD column index: ${podColIndex}, Trattamento: '${trattamentoColName}' at index ${trattamentoColIndex}`);

  // Find POD column by content if not found by header
  if (podColIndex === -1 && lines.length > dataStartIndex) {
    const firstDataRow = lines[dataStartIndex].split(separator);
    for (let i = 0; i < firstDataRow.length; i++) {
      if (firstDataRow[i]?.trim().startsWith('IT')) {
        podColIndex = i;
        console.log(`Found POD column by content at index ${i}`);
        break;
      }
    }
  }

  if (podColIndex === -1) {
    console.log('Could not find POD column');
    return { podCodesO: [], podCodesLP: [] };
  }

  const podCodesO: string[] = [];
  const podCodesLP: string[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length <= podColIndex) continue;

    const podCode = values[podColIndex] || '';
    const trattamento = trattamentoColIndex !== -1 ? (values[trattamentoColIndex] || '').toUpperCase().trim() : '';

    if (!podCode || podCode.length < 5) continue;

    const isHourly = trattamento === 'O' || trattamento === 'ORARIO' || 
                     trattamento === '1' || trattamento === 'TM' || trattamento === 'TMO';

    if (isHourly) {
      podCodesO.push(podCode);
    } else if (trattamento === 'F' || trattamento === 'LP' || trattamento === 'NM') {
      podCodesLP.push(podCode);
    }
  }

  console.log(`Parsed: ${podCodesO.length} POD O, ${podCodesLP.length} POD LP`);
  return { podCodesO, podCodesLP };
}

// Parse letture CSV
function parseLettureCSV(content: string): string[] {
  const podCodes: string[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return podCodes;

  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().toUpperCase());

  const podColNames = ['POD', 'CODICE_POD', 'COD_POD', 'CODICE POD', 'PUNTO_PRELIEVO', 'IDENTIFICATIVO_POD'];
  let podColIndex = -1;

  for (const name of podColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      podColIndex = idx;
      break;
    }
  }

  // Find by content
  if (podColIndex === -1 && lines.length > 1) {
    const firstDataRow = lines[1].split(separator);
    for (let i = 0; i < firstDataRow.length; i++) {
      if (firstDataRow[i]?.trim().startsWith('IT')) {
        podColIndex = i;
        break;
      }
    }
  }

  if (podColIndex === -1) return podCodes;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length > podColIndex) {
      const podCode = values[podColIndex];
      if (podCode && podCode.startsWith('IT') && podCode.length > 10) {
        podCodes.push(podCode);
      }
    }
  }

  return podCodes;
}

// Parse letture XML
function parseLettureXML(content: string): string[] {
  const podCodes: string[] = [];
  const podPatterns = [
    /<POD>([^<]+)<\/POD>/gi,
    /<CodPod>([^<]+)<\/CodPod>/gi,
    /<CodicePOD>([^<]+)<\/CodicePOD>/gi,
    /POD="([^"]+)"/gi,
  ];

  for (const pattern of podPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const podCode = match[1].trim();
      if (podCode.startsWith('IT') && podCode.length > 10) {
        podCodes.push(podCode);
      }
    }
  }

  return podCodes;
}

// Parse AGGR_IP CSV
function parseAggrIpCSV(content: string): { dailyCurves: number[][], warnings: string[] } {
  const dailyCurves: number[][] = [];
  const warnings: string[] = [];

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { dailyCurves, warnings };

  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().toUpperCase());

  // Find QH columns (QH1-QH96)
  const qhIndices: number[] = [];
  for (let i = 1; i <= 96; i++) {
    const idx = headers.indexOf(`QH${i}`);
    if (idx !== -1) qhIndices.push(idx);
  }

  // Fallback: assume QH columns start at index 8
  if (qhIndices.length !== 96 && headers.length >= 104) {
    qhIndices.length = 0;
    for (let i = 0; i < 96; i++) {
      qhIndices.push(8 + i);
    }
  }

  if (qhIndices.length !== 96) {
    warnings.push('Could not find 96 QH columns in AGGR_IP file');
    return { dailyCurves, warnings };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length < qhIndices[95]) continue;

    const dayCurve: number[] = [];
    let hasValidData = false;

    for (const idx of qhIndices) {
      const rawValue = values[idx] || '0';
      const numValue = parseFloat(rawValue.replace(',', '.')) || 0;
      dayCurve.push(numValue);
      if (numValue > 0) hasValidData = true;
    }

    if (hasValidData && dayCurve.length === 96) {
      dailyCurves.push(dayCurve);
    }
  }

  return { dailyCurves, warnings };
}

// Calculate average curve
function calculateAverageCurve(dailyCurves: number[][]): number[] {
  if (dailyCurves.length === 0) return Array(96).fill(0);

  const avgCurve: number[] = [];
  for (let qh = 0; qh < 96; qh++) {
    let sum = 0;
    let count = 0;
    for (const dayCurve of dailyCurves) {
      if (dayCurve[qh] !== undefined) {
        sum += dayCurve[qh];
        count++;
      }
    }
    avgCurve.push(count > 0 ? sum / count : 0);
  }

  return avgCurve;
}
