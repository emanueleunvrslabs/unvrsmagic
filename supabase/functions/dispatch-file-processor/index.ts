import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for streaming
const MAX_PROCESSING_TIME_MS = 55000; // 55 seconds max (leave buffer for response)

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

    const { fileId, jobId, userId, action } = await req.json();

    console.log(`Processing file ${fileId} for job ${jobId}, action: ${action}`);

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('dispatch_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileId}`);
    }

    console.log(`File: ${file.file_name}, type: ${file.file_type}, size: ${file.file_size} bytes`);

    // Create intermediate result entry
    const { data: intermediateResult, error: createError } = await supabase
      .from('dispatch_intermediate_results')
      .insert({
        job_id: jobId,
        user_id: userId,
        file_id: fileId,
        result_type: file.file_type.toLowerCase(),
        zone_code: file.zone_code,
        status: 'processing'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating intermediate result:', createError);
    }

    let result: any = { success: false };

    try {
      switch (file.file_type) {
        case 'LETTURE':
          result = await processLettureFile(supabase, file, startTime);
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

      // Update intermediate result
      if (intermediateResult) {
        await supabase
          .from('dispatch_intermediate_results')
          .update({
            status: result.success ? 'completed' : 'failed',
            data: result,
            error_message: result.error || null,
            processing_time_ms: Date.now() - startTime
          })
          .eq('id', intermediateResult.id);
      }

    } catch (processError) {
      const errorMsg = processError instanceof Error ? processError.message : 'Unknown error';
      
      if (intermediateResult) {
        await supabase
          .from('dispatch_intermediate_results')
          .update({
            status: 'failed',
            error_message: errorMsg,
            processing_time_ms: Date.now() - startTime
          })
          .eq('id', intermediateResult.id);
      }

      result = { success: false, error: errorMsg };
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        fileId,
        fileName: file.file_name,
        fileType: file.file_type,
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

// Stream download file content
async function downloadFileStreaming(supabase: any, fileUrl: string): Promise<Uint8Array | null> {
  try {
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      console.error('Invalid storage URL format:', fileUrl);
      return null;
    }
    
    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0];
    const filePath = pathParts.slice(1).join('/');
    
    console.log(`Streaming download from bucket: ${bucketName}, path: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }
    
    return new Uint8Array(await data.arrayBuffer());
  } catch (error) {
    console.error('Error in downloadFileStreaming:', error);
    return null;
  }
}

// Process LETTURE file with streaming ZIP handling
async function processLettureFile(supabase: any, file: any, startTime: number): Promise<any> {
  const content = await downloadFileStreaming(supabase, file.file_url);
  if (!content) {
    return { success: false, error: 'Could not download file' };
  }

  console.log(`Downloaded ${content.length} bytes for letture file`);

  const allPods: string[] = [];
  let filesProcessed = 0;
  let skippedFiles = 0;
  const warnings: string[] = [];
  const fileName = file.file_name.toLowerCase();

  try {
    if (fileName.endsWith('.zip')) {
      // Dynamic import JSZip
      const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
      
      const zip = await JSZip.loadAsync(content);
      const allFiles = Object.keys(zip.files).filter(name => !zip.files[name].dir);
      
      console.log(`ZIP contains ${allFiles.length} files`);

      // Process files with time limit
      const csvFiles = allFiles.filter(f => f.toLowerCase().endsWith('.csv'));
      const xmlFiles = allFiles.filter(f => f.toLowerCase().endsWith('.xml'));
      const nestedZips = allFiles.filter(f => f.toLowerCase().endsWith('.zip'));

      // Process CSVs
      for (const csvName of csvFiles) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push(`Timeout: ${csvFiles.length - filesProcessed} CSV files remaining`);
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

      // Process XMLs
      for (const xmlName of xmlFiles) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push(`Timeout: remaining XML files skipped`);
          break;
        }

        try {
          const xmlContent = await zip.files[xmlName].async('string');
          const pods = parseLettureXML(xmlContent);
          allPods.push(...pods);
          filesProcessed++;
        } catch (e) {
          console.error(`Error processing ${xmlName}:`, e);
        }
      }

      // Process nested ZIPs (limited)
      const maxNestedZips = 20;
      for (let i = 0; i < Math.min(nestedZips.length, maxNestedZips); i++) {
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
          warnings.push(`Timeout: remaining nested ZIPs skipped`);
          break;
        }

        const nestedZipName = nestedZips[i];
        try {
          const nestedData = await zip.files[nestedZipName].async('arraybuffer');
          const nestedZip = await JSZip.loadAsync(nestedData);
          const nestedFiles = Object.keys(nestedZip.files)
            .filter(n => !nestedZip.files[n].dir)
            .filter(n => n.toLowerCase().endsWith('.csv') || n.toLowerCase().endsWith('.xml'));

          for (const nestedFile of nestedFiles.slice(0, 100)) {
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

          if (nestedFiles.length > 100) {
            skippedFiles += nestedFiles.length - 100;
          }
        } catch (e) {
          console.error(`Error processing nested ZIP ${nestedZipName}:`, e);
        }
      }

      if (nestedZips.length > maxNestedZips) {
        skippedFiles += nestedZips.length - maxNestedZips;
        warnings.push(`${nestedZips.length - maxNestedZips} nested ZIPs skipped`);
      }

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
    warnings
  };
}

// Process ANAGRAFICA file
async function processAnagraficaFile(supabase: any, file: any, startTime: number): Promise<any> {
  const content = await downloadFileStreaming(supabase, file.file_url);
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
        const parsed = parseAnagraficaCSV(csvContent, file.zone_code, file.month_reference);
        podCodesO.push(...parsed.podCodesO);
        podCodesLP.push(...parsed.podCodesLP);
      }
    } else if (fileName.endsWith('.csv')) {
      const textContent = new TextDecoder().decode(content);
      const parsed = parseAnagraficaCSV(textContent, file.zone_code, file.month_reference);
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
  const content = await downloadFileStreaming(supabase, file.file_url);
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

  // Calculate average curve
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

// Process IP_DETAIL file
async function processIpDetailFile(supabase: any, file: any, startTime: number): Promise<any> {
  const content = await downloadFileStreaming(supabase, file.file_url);
  if (!content) {
    return { success: false, error: 'Could not download file' };
  }

  const ipPodCodes: string[] = [];
  const fileName = file.file_name.toLowerCase();

  try {
    if (fileName.endsWith('.csv')) {
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

  return {
    success: true,
    ip_pod_codes: uniqueIpPods,
    total_ip_pods: uniqueIpPods.length
  };
}

// Helper parsing functions
function parseLettureCSV(content: string): string[] {
  const podCodes: string[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return podCodes;

  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());

  const podColNames = ['POD', 'CODICE_POD', 'COD_POD', 'CODICE POD', 'PUNTO_PRELIEVO', 'IDENTIFICATIVO_POD'];
  let podColIndex = -1;

  for (const name of podColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      podColIndex = idx;
      break;
    }
  }

  if (podColIndex === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (lines.length > 1) {
        const firstDataRow = lines[1].split(separator);
        if (firstDataRow[i]?.trim().startsWith('IT')) {
          podColIndex = i;
          break;
        }
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

function parseAnagraficaCSV(content: string, zoneCode?: string, dispatchMonth?: string): { podCodesO: string[], podCodesLP: string[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { podCodesO: [], podCodesLP: [] };

  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());

  const podColNames = ['POD', 'CODICE_POD', 'COD_POD', 'CODICE POD', 'PUNTO_PRELIEVO'];
  let podColIndex = -1;

  for (const name of podColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      podColIndex = idx;
      break;
    }
  }

  // Find trattamento column
  let trattamentoColIndex = -1;
  if (dispatchMonth) {
    const monthNum = parseInt(dispatchMonth.split('-')[1], 10);
    const monthStr = monthNum.toString().padStart(2, '0');
    const trattamentoColNames = [
      `TRATTAMENTO_${monthStr}`, `TRATTAMENTO_${monthNum}`,
      `TRATTAMENTO${monthStr}`, `TRATTAMENTO${monthNum}`,
      `TIPO_TRATTAMENTO_${monthStr}`, `TIPO_TRATTAMENTO_${monthNum}`
    ];

    for (const colName of trattamentoColNames) {
      const idx = headers.indexOf(colName);
      if (idx !== -1) {
        trattamentoColIndex = idx;
        break;
      }
    }
  }

  if (trattamentoColIndex === -1) {
    const fallbackColNames = ['TRATTAMENTO', 'TIPO_TRATTAMENTO', 'TIPO_MISURATORE', 'TIPO'];
    for (const name of fallbackColNames) {
      const idx = headers.indexOf(name);
      if (idx !== -1) {
        trattamentoColIndex = idx;
        break;
      }
    }
  }

  if (podColIndex === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (lines.length > 1) {
        const firstDataRow = lines[1].split(separator);
        if (firstDataRow[i]?.trim().startsWith('IT')) {
          podColIndex = i;
          break;
        }
      }
    }
  }

  if (podColIndex === -1) return { podCodesO: [], podCodesLP: [] };

  const podCodesO: string[] = [];
  const podCodesLP: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length <= podColIndex) continue;

    const podCode = values[podColIndex] || '';
    const trattamento = trattamentoColIndex !== -1 ? (values[trattamentoColIndex] || '').toUpperCase().trim() : '';

    if (!podCode || podCode.length < 5) continue;

    const isHourly = trattamento === 'O' || trattamento === 'ORARIO' || 
                     trattamento === '1' || trattamento === 'TM' || trattamento === 'TMO' ||
                     (trattamentoColIndex === -1 && podCode.startsWith('IT'));

    if (isHourly) {
      podCodesO.push(podCode);
    } else if (trattamento) {
      podCodesLP.push(podCode);
    }
  }

  return { podCodesO, podCodesLP };
}

function parseAggrIpCSV(content: string): { dailyCurves: number[][], warnings: string[] } {
  const dailyCurves: number[][] = [];
  const warnings: string[] = [];

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { dailyCurves, warnings };

  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());

  const qhIndices: number[] = [];
  for (let i = 1; i <= 96; i++) {
    const colName = `QH${i}`;
    const idx = headers.indexOf(colName);
    if (idx !== -1) {
      qhIndices.push(idx);
    }
  }

  if (qhIndices.length !== 96) {
    const startIdx = 8;
    if (headers.length >= startIdx + 96) {
      qhIndices.length = 0;
      for (let i = 0; i < 96; i++) {
        qhIndices.push(startIdx + i);
      }
    } else {
      warnings.push('Formato file AGGR_IP non riconosciuto');
      return { dailyCurves, warnings };
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length < qhIndices[qhIndices.length - 1]) continue;

    const dayCurve: number[] = [];
    let hasValidData = false;

    for (const idx of qhIndices) {
      const rawValue = values[idx] || '0';
      const normalizedValue = rawValue.replace(',', '.');
      const numValue = parseFloat(normalizedValue) || 0;
      dayCurve.push(numValue);
      if (numValue > 0) hasValidData = true;
    }

    if (hasValidData && dayCurve.length === 96) {
      dailyCurves.push(dayCurve);
    }
  }

  return { dailyCurves, warnings };
}

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
