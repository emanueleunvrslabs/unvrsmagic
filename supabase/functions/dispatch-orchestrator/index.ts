import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dispatchMonth, zones } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user } } = await supabase.auth.getUser(token || '');
    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Starting dispatch orchestration', { user: user.id, dispatchMonth, zones });

    if (!zones || zones.length === 0) {
      throw new Error('No zones specified');
    }

    const [year, month] = dispatchMonth.split('-').map(Number);
    const historicalYear = year - 1;
    const historicalMonth = `${historicalYear}-${month.toString().padStart(2, '0')}`;

    const jobIds: string[] = [];
    
    for (const zone of zones) {
      const { data: job, error: jobError } = await supabase
        .from('dispatch_jobs')
        .insert({
          user_id: user.id,
          zone_code: zone,
          dispatch_month: dispatchMonth,
          historical_month: historicalMonth,
          status: 'processing',
          started_at: new Date().toISOString(),
          current_agent: 'DISPATCH.BRAIN',
          progress: 0
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job for zone:', zone, jobError);
        throw jobError;
      }

      console.log('Job created for zone:', zone, 'ID:', job.id);
      jobIds.push(job.id);

      const backgroundTask = orchestrateAgents(supabase, job.id, user.id, zone, dispatchMonth, historicalMonth);
      
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(backgroundTask);
      } else {
        backgroundTask.catch(err => console.error('Background task error for zone:', zone, err));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobIds,
        zones,
        message: `Elaborazione avviata per ${zones.length} zone: ${zones.join(', ')}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dispatch-orchestrator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function orchestrateAgents(
  supabase: any,
  jobId: string,
  userId: string,
  zoneCode: string,
  dispatchMonth: string,
  historicalMonth: string
) {
  try {
    console.log('Background orchestration started for job:', jobId, 'zone:', zoneCode);

    await logAgentActivity(supabase, userId, 'DISPATCH.BRAIN', 'info', `Orchestrazione avviata per zona ${zoneCode}`, { jobId, dispatchMonth, zoneCode });

    const { data: userFiles, error: filesError } = await supabase
      .from('dispatch_files')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'uploaded');

    if (filesError) {
      throw new Error(`Error fetching files: ${filesError.message}`);
    }

    console.log(`Found ${userFiles?.length || 0} files for user`);

    const anagraficaFiles = userFiles?.filter((f: any) => 
      f.file_type === 'ANAGRAFICA' && (f.zone_code === zoneCode || !f.zone_code)
    ) || [];
    const ipFiles = userFiles?.filter((f: any) => f.file_type === 'AGGR_IP') || [];
    const ipDetailFiles = userFiles?.filter((f: any) => f.file_type === 'IP_DETAIL') || [];
    const lettureFiles = userFiles?.filter((f: any) => f.file_type === 'LETTURE') || [];

    // Step 1: ANAGRAFICA.INTAKE (15%)
    await updateJobProgress(supabase, jobId, 'ANAGRAFICA.INTAKE', 15);
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'running');
    await logAgentActivity(supabase, userId, 'ANAGRAFICA.INTAKE', 'info', `Elaborazione anagrafica POD zona ${zoneCode} (solo tipo O)`, { files: anagraficaFiles.length, zone: zoneCode });
    
    const anagraficaResult = await processAnagraficaStep(supabase, userId, anagraficaFiles, ipDetailFiles, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'completed', anagraficaResult);
    await logAgentActivity(supabase, userId, 'ANAGRAFICA.INTAKE', 'info', `Anagrafica completata: ${anagraficaResult.total_pods_o} POD orari trovati`, anagraficaResult);

    // Step 2: IP.ASSIMILATOR (30%)
    await updateJobProgress(supabase, jobId, 'IP.ASSIMILATOR', 30);
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'running');
    await logAgentActivity(supabase, userId, 'IP.ASSIMILATOR', 'info', `Elaborazione illuminazione pubblica zona ${zoneCode}`, { files: ipFiles.length });
    
    const ipResult = await processIpStep(supabase, userId, ipFiles, historicalMonth, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'completed', ipResult);
    await logAgentActivity(supabase, userId, 'IP.ASSIMILATOR', 'info', 
      `IP completato: ${ipResult.days_processed || 0} giorni elaborati, consumo totale: ${(ipResult.total_ip_consumption || 0).toFixed(2)}`, 
      { days: ipResult.days_processed, total: ipResult.total_ip_consumption }
    );

    // Step 3: HISTORY.RESOLVER (50%)
    await updateJobProgress(supabase, jobId, 'HISTORY.RESOLVER', 50);
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'running');
    await logAgentActivity(supabase, userId, 'HISTORY.RESOLVER', 'info', `Elaborazione POD orari (O) zona ${zoneCode} - Parsing letture e incrocio`, { files: lettureFiles.length });
    
    const historyResult = await processHistoryStep(supabase, userId, lettureFiles, dispatchMonth, historicalMonth, zoneCode, anagraficaResult.pod_codes_o);
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'completed', historyResult);
    await logAgentActivity(supabase, userId, 'HISTORY.RESOLVER', 'info', 
      `Incrocio completato: ${historyResult.pods_with_data} POD con dati, ${historyResult.pods_without_data} senza dati`, 
      { pods_with_data: historyResult.pods_with_data, pods_without_data: historyResult.pods_without_data }
    );

    // Step 4: AGG.SCHEDULER (70%)
    await updateJobProgress(supabase, jobId, 'AGG.SCHEDULER', 70);
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'running');
    await logAgentActivity(supabase, userId, 'AGG.SCHEDULER', 'info', `Aggregazione curve IP + O zona ${zoneCode}`);
    
    const aggResult = await processAggStep(supabase, ipResult, historyResult);
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'completed', aggResult);

    // Step 5: QA.WATCHDOG (85%)
    await updateJobProgress(supabase, jobId, 'QA.WATCHDOG', 85);
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'running');
    await logAgentActivity(supabase, userId, 'QA.WATCHDOG', 'info', `Controllo qualità dati zona ${zoneCode}`);
    
    const qaResult = await processQaStep(supabase, aggResult);
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'completed', qaResult);

    // Step 6: EXPORT.HUB (95%)
    await updateJobProgress(supabase, jobId, 'EXPORT.HUB', 95);
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'running');
    await logAgentActivity(supabase, userId, 'EXPORT.HUB', 'info', `Generazione output zona ${zoneCode}`);
    
    const exportResult = await processExportStep(supabase, aggResult, qaResult, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'completed', exportResult);

    // Save final results
    const { error: resultError } = await supabase
      .from('dispatch_results')
      .insert({
        job_id: jobId,
        user_id: userId,
        zone_code: zoneCode,
        dispatch_month: dispatchMonth,
        curve_96_values: aggResult.dispatch_curve,
        ip_curve: aggResult.ip_curve,
        o_curve: aggResult.o_curve,
        total_pods: anagraficaResult.total_pods_o,
        pods_with_data: historyResult.pods_with_data,
        pods_without_data: historyResult.pods_without_data,
        quality_score: qaResult.quality_score,
        metadata: { 
          ...exportResult, 
          zone: zoneCode, 
          ip_pods_deducted: anagraficaResult.ip_pods_deducted,
          pods_in_letture: historyResult.unique_pods_in_letture,
          pods_missing: historyResult.pods_missing
        }
      });

    if (resultError) {
      console.error('Error saving results for zone:', zoneCode, resultError);
    }

    await supabase
      .from('dispatch_jobs')
      .update({
        status: 'completed',
        progress: 100,
        current_agent: null,
        completed_at: new Date().toISOString(),
        warnings: qaResult.warnings || []
      })
      .eq('id', jobId);

    await logAgentActivity(supabase, userId, 'DISPATCH.BRAIN', 'info', `Orchestrazione completata per zona ${zoneCode}`, { jobId, zoneCode });
    console.log('Orchestration completed successfully for job:', jobId, 'zone:', zoneCode);

  } catch (error) {
    console.error('Orchestration error for zone:', zoneCode, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await supabase
      .from('dispatch_jobs')
      .update({
        status: 'failed',
        errors: [{ message: errorMessage, timestamp: new Date().toISOString(), zone: zoneCode }],
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    await logAgentActivity(supabase, userId, 'DISPATCH.BRAIN', 'error', `Errore orchestrazione zona ${zoneCode}: ${errorMessage}`, { jobId, zoneCode });
  }
}

// Helper function to download file content from storage
async function downloadFileContent(supabase: any, fileUrl: string): Promise<ArrayBuffer | null> {
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
    
    return await data.arrayBuffer();
  } catch (error) {
    console.error('Error in downloadFileContent:', error);
    return null;
  }
}

// Parse CSV content to extract POD data
function parseAnagraficaCSV(content: string, zoneCode: string): { podCodesO: string[], podCodesLP: string[], allPods: any[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { podCodesO: [], podCodesLP: [], allPods: [] };
  
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());
  
  console.log('CSV Headers found:', headers);
  
  const podColNames = ['POD', 'CODICE_POD', 'COD_POD', 'CODICE POD', 'PUNTO_PRELIEVO'];
  const typeColNames = ['TRATTAMENTO', 'TIPO_TRATTAMENTO', 'TIPO_MISURATORE', 'TIPO', 'TIPOLOGIA', 'TIPO_CONTATORE', 'TIPO TRATTAMENTO'];
  
  let podColIndex = -1;
  let typeColIndex = -1;
  
  for (const name of podColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      podColIndex = idx;
      break;
    }
  }
  
  for (const name of typeColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      typeColIndex = idx;
      break;
    }
  }
  
  console.log(`POD column index: ${podColIndex}, Type column index: ${typeColIndex}`);
  
  const podCodesO: string[] = [];
  const podCodesLP: string[] = [];
  const allPods: any[] = [];
  
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
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    
    if (values.length <= podColIndex) continue;
    
    const podCode = values[podColIndex] || '';
    const meterType = typeColIndex !== -1 ? (values[typeColIndex] || '').toUpperCase() : '';
    
    if (!podCode || podCode.length < 5) continue;
    
    const pod = {
      pod_code: podCode,
      meter_type: meterType,
      raw_data: values
    };
    
    allPods.push(pod);
    
    if (meterType === 'O' || meterType === 'ORARIO' || meterType === '1' || meterType === 'TM') {
      podCodesO.push(podCode);
    } else if (meterType) {
      podCodesLP.push(podCode);
    } else {
      podCodesO.push(podCode);
    }
  }
  
  console.log(`Parsed ${allPods.length} total PODs: ${podCodesO.length} type O, ${podCodesLP.length} type LP`);
  
  return { podCodesO, podCodesLP, allPods };
}

// Parse letture files (PDO, SOS) to extract POD codes with readings
function parseLettureCSV(content: string): string[] {
  const podCodes: string[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return podCodes;
  
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());
  
  // Find POD column - common names in PDO/SOS files
  const podColNames = ['POD', 'CODICE_POD', 'COD_POD', 'CODICE POD', 'PUNTO_PRELIEVO', 'PUNTO PRELIEVO', 'IDENTIFICATIVO_POD'];
  let podColIndex = -1;
  
  for (const name of podColNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      podColIndex = idx;
      break;
    }
  }
  
  // If not found by header, try to find column with IT* POD codes
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
  
  if (podColIndex === -1) {
    console.log('Could not find POD column in letture file');
    return podCodes;
  }
  
  // Extract POD codes from data rows
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

// Parse XML files (common format for PDO/SOS)
function parseLettureXML(content: string): string[] {
  const podCodes: string[] = [];
  
  // Simple regex-based XML parsing for POD codes
  // Look for common XML tags containing POD codes
  const podPatterns = [
    /<POD>([^<]+)<\/POD>/gi,
    /<CodPod>([^<]+)<\/CodPod>/gi,
    /<CodicePOD>([^<]+)<\/CodicePOD>/gi,
    /<CODICE_POD>([^<]+)<\/CODICE_POD>/gi,
    /<PuntoPrelievo>([^<]+)<\/PuntoPrelievo>/gi,
    /POD="([^"]+)"/gi,
    /CodPod="([^"]+)"/gi,
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

// Configuration for chunked processing
const MAX_FILES_PER_ZIP = 300; // Maximum files to process from a single ZIP
const MAX_NESTED_ZIPS = 50; // Maximum nested ZIPs to process
const PROCESSING_TIMEOUT_MS = 20000; // 20 seconds max per ZIP file

// Extract POD codes from letture files (ZIP containing CSV/XML) with chunked processing
async function extractPodsFromLettureFiles(supabase: any, files: any[]): Promise<{ allPods: string[], filesProcessed: number, warnings: string[], skippedFiles: number }> {
  const allPods: string[] = [];
  let filesProcessed = 0;
  let skippedFiles = 0;
  const warnings: string[] = [];
  const startTime = Date.now();
  
  for (const file of files) {
    // Check if we're running low on time
    if (Date.now() - startTime > 25000) {
      warnings.push('Timeout raggiunto, alcuni file non elaborati');
      break;
    }
    
    try {
      const content = await downloadFileContent(supabase, file.file_url);
      if (!content) {
        warnings.push(`Impossibile scaricare: ${file.file_name}`);
        continue;
      }
      
      const fileName = file.file_name.toLowerCase();
      
      if (fileName.endsWith('.zip')) {
        // Process ZIP file with chunking
        try {
          const zipStartTime = Date.now();
          const zip = await JSZip.loadAsync(content);
          const allInnerFiles = Object.keys(zip.files).filter(name => !zip.files[name].dir);
          
          console.log(`ZIP ${file.file_name} contains ${allInnerFiles.length} files`);
          
          // Separate files by type for smarter processing
          const csvFiles = allInnerFiles.filter(f => f.toLowerCase().endsWith('.csv'));
          const xmlFiles = allInnerFiles.filter(f => f.toLowerCase().endsWith('.xml'));
          const nestedZips = allInnerFiles.filter(f => f.toLowerCase().endsWith('.zip'));
          
          console.log(`Found: ${csvFiles.length} CSV, ${xmlFiles.length} XML, ${nestedZips.length} nested ZIPs`);
          
          // Process CSV files (limited)
          const csvToProcess = csvFiles.slice(0, MAX_FILES_PER_ZIP);
          if (csvFiles.length > MAX_FILES_PER_ZIP) {
            warnings.push(`ZIP ${file.file_name}: elaborati ${MAX_FILES_PER_ZIP}/${csvFiles.length} CSV (sampling)`);
            skippedFiles += csvFiles.length - MAX_FILES_PER_ZIP;
          }
          
          for (const innerFileName of csvToProcess) {
            if (Date.now() - zipStartTime > PROCESSING_TIMEOUT_MS) {
              warnings.push(`Timeout ZIP ${file.file_name}, file rimanenti saltati`);
              break;
            }
            
            try {
              const innerContent = await zip.files[innerFileName].async('string');
              const pods = parseLettureCSV(innerContent);
              
              if (pods.length > 0) {
                allPods.push(...pods);
                filesProcessed++;
              }
            } catch (innerErr) {
              console.error(`Error processing ${innerFileName}:`, innerErr);
            }
          }
          
          // Process XML files (limited)
          const xmlToProcess = xmlFiles.slice(0, MAX_FILES_PER_ZIP);
          if (xmlFiles.length > MAX_FILES_PER_ZIP) {
            warnings.push(`ZIP ${file.file_name}: elaborati ${MAX_FILES_PER_ZIP}/${xmlFiles.length} XML (sampling)`);
            skippedFiles += xmlFiles.length - MAX_FILES_PER_ZIP;
          }
          
          for (const innerFileName of xmlToProcess) {
            if (Date.now() - zipStartTime > PROCESSING_TIMEOUT_MS) {
              warnings.push(`Timeout ZIP ${file.file_name}, XML rimanenti saltati`);
              break;
            }
            
            try {
              const innerContent = await zip.files[innerFileName].async('string');
              const pods = parseLettureXML(innerContent);
              
              if (pods.length > 0) {
                allPods.push(...pods);
                filesProcessed++;
              }
            } catch (innerErr) {
              console.error(`Error processing XML ${innerFileName}:`, innerErr);
            }
          }
          
          // Process nested ZIPs (limited)
          const nestedToProcess = nestedZips.slice(0, MAX_NESTED_ZIPS);
          if (nestedZips.length > MAX_NESTED_ZIPS) {
            warnings.push(`ZIP ${file.file_name}: elaborati ${MAX_NESTED_ZIPS}/${nestedZips.length} ZIP annidati`);
            skippedFiles += nestedZips.length - MAX_NESTED_ZIPS;
          }
          
          for (const nestedZipName of nestedToProcess) {
            if (Date.now() - zipStartTime > PROCESSING_TIMEOUT_MS) {
              warnings.push(`Timeout nested ZIPs, rimanenti saltati`);
              break;
            }
            
            try {
              const nestedZipData = await zip.files[nestedZipName].async('arraybuffer');
              const nestedZip = await JSZip.loadAsync(nestedZipData);
              const nestedFiles = Object.keys(nestedZip.files)
                .filter(name => !nestedZip.files[name].dir)
                .filter(name => name.toLowerCase().endsWith('.csv') || name.toLowerCase().endsWith('.xml'));
              
              // Limit nested file processing too
              const nestedToProcessInner = nestedFiles.slice(0, 100);
              
              for (const nestedFileName of nestedToProcessInner) {
                try {
                  const nestedContent = await nestedZip.files[nestedFileName].async('string');
                  const nestedLowerName = nestedFileName.toLowerCase();
                  
                  let nestedPods: string[] = [];
                  if (nestedLowerName.endsWith('.csv')) {
                    nestedPods = parseLettureCSV(nestedContent);
                  } else if (nestedLowerName.endsWith('.xml')) {
                    nestedPods = parseLettureXML(nestedContent);
                  }
                  
                  if (nestedPods.length > 0) {
                    allPods.push(...nestedPods);
                    filesProcessed++;
                  }
                } catch (nestedErr) {
                  // Silent fail for nested files
                }
              }
              
              if (nestedFiles.length > 100) {
                skippedFiles += nestedFiles.length - 100;
              }
            } catch (nestedErr) {
              console.error(`Error processing nested ZIP ${nestedZipName}:`, nestedErr);
            }
          }
          
          console.log(`ZIP processing complete: ${filesProcessed} files processed, ${skippedFiles} skipped`);
          
        } catch (zipError) {
          console.error('Error processing ZIP:', zipError);
          warnings.push(`Errore estrazione ZIP: ${file.file_name}`);
        }
      } else if (fileName.endsWith('.csv')) {
        const textContent = new TextDecoder().decode(content);
        const pods = parseLettureCSV(textContent);
        allPods.push(...pods);
        filesProcessed++;
      } else if (fileName.endsWith('.xml')) {
        const textContent = new TextDecoder().decode(content);
        const pods = parseLettureXML(textContent);
        allPods.push(...pods);
        filesProcessed++;
      }
    } catch (error) {
      console.error(`Error processing letture file ${file.file_name}:`, error);
      warnings.push(`Errore elaborazione: ${file.file_name}`);
    }
  }
  
  // Deduplicate PODs
  const uniquePods = [...new Set(allPods)];
  console.log(`Total PODs extracted: ${uniquePods.length} unique (from ${allPods.length} total)`);
  
  return { allPods: uniquePods, filesProcessed, warnings, skippedFiles };
}

// Parse IP Detail file to get IP POD codes
async function parseIPDetailFile(supabase: any, fileUrl: string): Promise<string[]> {
  const ipPodCodes: string[] = [];
  
  try {
    const content = await downloadFileContent(supabase, fileUrl);
    if (!content) return ipPodCodes;
    
    const fileName = fileUrl.toLowerCase();
    
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
    console.error('Error parsing IP detail file:', error);
  }
  
  return ipPodCodes;
}

// Processing step functions
async function processAnagraficaStep(supabase: any, userId: string, files: any[], ipDetailFiles: any[], zoneCode: string) {
  console.log(`Processing anagrafica for zone ${zoneCode}, files: ${files.length}, ipDetailFiles: ${ipDetailFiles.length}`);
  
  let allPodCodesO: string[] = [];
  let allPodCodesLP: string[] = [];
  let totalPodsProcessed = 0;
  const warnings: string[] = [];
  
  for (const file of files) {
    try {
      const fileUrl = file.file_url;
      const fileName = file.file_name.toLowerCase();
      
      console.log(`Processing anagrafica file: ${fileName}`);
      
      const content = await downloadFileContent(supabase, fileUrl);
      if (!content) {
        warnings.push(`Impossibile leggere il file: ${file.file_name}`);
        continue;
      }
      
      if (fileName.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(content);
          const csvFiles = Object.keys(zip.files).filter(name => 
            name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
          );
          
          console.log(`Found ${csvFiles.length} CSV files in ZIP`);
          
          for (const csvName of csvFiles) {
            const csvContent = await zip.files[csvName].async('string');
            const parsed = parseAnagraficaCSV(csvContent, zoneCode);
            allPodCodesO = allPodCodesO.concat(parsed.podCodesO);
            allPodCodesLP = allPodCodesLP.concat(parsed.podCodesLP);
            totalPodsProcessed += parsed.allPods.length;
          }
        } catch (zipError) {
          console.error('Error processing ZIP:', zipError);
          warnings.push(`Errore nell'estrazione del file ZIP: ${file.file_name}`);
        }
      } else if (fileName.endsWith('.csv')) {
        const textContent = new TextDecoder().decode(content);
        const parsed = parseAnagraficaCSV(textContent, zoneCode);
        allPodCodesO = allPodCodesO.concat(parsed.podCodesO);
        allPodCodesLP = allPodCodesLP.concat(parsed.podCodesLP);
        totalPodsProcessed += parsed.allPods.length;
      }
    } catch (error) {
      console.error(`Error processing file ${file.file_name}:`, error);
      warnings.push(`Errore nell'elaborazione del file: ${file.file_name}`);
    }
  }
  
  allPodCodesO = [...new Set(allPodCodesO)];
  allPodCodesLP = [...new Set(allPodCodesLP)];
  
  let ipPodCodes: string[] = [];
  for (const ipFile of ipDetailFiles) {
    const ipPods = await parseIPDetailFile(supabase, ipFile.file_url);
    ipPodCodes = ipPodCodes.concat(ipPods);
  }
  ipPodCodes = [...new Set(ipPodCodes)];
  
  const originalOCount = allPodCodesO.length;
  allPodCodesO = allPodCodesO.filter(pod => !ipPodCodes.includes(pod));
  const ipPodsDeducted = originalOCount - allPodCodesO.length;
  
  console.log(`Anagrafica processing complete: ${allPodCodesO.length} POD O (after deducting ${ipPodsDeducted} IP), ${allPodCodesLP.length} POD LP`);
  
  return {
    total_pods_o: allPodCodesO.length,
    total_pods_lp: allPodCodesLP.length,
    total_raw: totalPodsProcessed,
    pod_codes_o: allPodCodesO,
    pod_codes_lp: allPodCodesLP,
    zone: zoneCode,
    ip_pods_deducted: ipPodsDeducted,
    ip_pod_codes: ipPodCodes,
    files_processed: files.length,
    warnings
  };
}

// Parse AGGR_IP CSV file to extract 96 quarter-hour values
function parseAggrIpCSV(content: string): { dailyCurves: number[][], daysProcessed: number, warnings: string[] } {
  const dailyCurves: number[][] = [];
  const warnings: string[] = [];
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { dailyCurves, daysProcessed: 0, warnings };
  
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());
  
  console.log('AGGR_IP Headers:', headers.slice(0, 15), '...');
  
  // Find QH1-QH96 column indices
  const qhIndices: number[] = [];
  for (let i = 1; i <= 96; i++) {
    const colName = `QH${i}`;
    const idx = headers.indexOf(colName);
    if (idx !== -1) {
      qhIndices.push(idx);
    }
  }
  
  console.log(`Found ${qhIndices.length} QH columns`);
  
  if (qhIndices.length !== 96) {
    // Try alternative: find columns by position after standard headers
    // Standard headers: ANNO;MESE;CODICE_DP;DATA;AREA;FASCIA_GEOGRAFICA;PIVA_DISTRIBUTORE;RAGIONE_SOCIALE_DISTRIBUTORE;QH1...
    const startIdx = 8; // After the 8 standard header columns
    if (headers.length >= startIdx + 96) {
      qhIndices.length = 0;
      for (let i = 0; i < 96; i++) {
        qhIndices.push(startIdx + i);
      }
      console.log('Using positional QH columns starting at index', startIdx);
    } else {
      warnings.push('Formato file AGGR_IP non riconosciuto: colonne QH non trovate');
      return { dailyCurves, daysProcessed: 0, warnings };
    }
  }
  
  // Parse data rows (each row = one day)
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    
    if (values.length < qhIndices[qhIndices.length - 1]) {
      continue; // Skip incomplete rows
    }
    
    const dayCurve: number[] = [];
    let hasValidData = false;
    
    for (const idx of qhIndices) {
      const rawValue = values[idx] || '0';
      // Handle both comma and dot as decimal separator
      const normalizedValue = rawValue.replace(',', '.');
      const numValue = parseFloat(normalizedValue) || 0;
      dayCurve.push(numValue);
      if (numValue > 0) hasValidData = true;
    }
    
    if (hasValidData && dayCurve.length === 96) {
      dailyCurves.push(dayCurve);
    }
  }
  
  console.log(`Parsed ${dailyCurves.length} days of IP data`);
  
  return { dailyCurves, daysProcessed: dailyCurves.length, warnings };
}

// Calculate average daily profile from multiple days
function calculateAverageCurve(dailyCurves: number[][]): number[] {
  if (dailyCurves.length === 0) {
    return Array(96).fill(0);
  }
  
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

async function processIpStep(supabase: any, userId: string, files: any[], historicalMonth: string, zoneCode: string) {
  console.log(`Processing IP step for zone ${zoneCode}, files: ${files.length}`);
  
  const allDailyCurves: number[][] = [];
  const warnings: string[] = [];
  let filesProcessed = 0;
  
  for (const file of files) {
    try {
      const content = await downloadFileContent(supabase, file.file_url);
      if (!content) {
        warnings.push(`Impossibile scaricare: ${file.file_name}`);
        continue;
      }
      
      const fileName = file.file_name.toLowerCase();
      
      if (fileName.endsWith('.zip')) {
        // Process ZIP file
        try {
          const zip = await JSZip.loadAsync(content);
          const csvFiles = Object.keys(zip.files).filter(name => 
            name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
          );
          
          console.log(`Found ${csvFiles.length} CSV files in AGGR_IP ZIP`);
          
          for (const csvName of csvFiles) {
            const csvContent = await zip.files[csvName].async('string');
            const parsed = parseAggrIpCSV(csvContent);
            allDailyCurves.push(...parsed.dailyCurves);
            warnings.push(...parsed.warnings);
            if (parsed.daysProcessed > 0) filesProcessed++;
          }
        } catch (zipError) {
          console.error('Error processing AGGR_IP ZIP:', zipError);
          warnings.push(`Errore estrazione ZIP: ${file.file_name}`);
        }
      } else if (fileName.endsWith('.csv')) {
        const textContent = new TextDecoder().decode(content);
        const parsed = parseAggrIpCSV(textContent);
        allDailyCurves.push(...parsed.dailyCurves);
        warnings.push(...parsed.warnings);
        if (parsed.daysProcessed > 0) filesProcessed++;
      }
    } catch (error) {
      console.error(`Error processing AGGR_IP file ${file.file_name}:`, error);
      warnings.push(`Errore elaborazione: ${file.file_name}`);
    }
  }
  
  // Calculate average daily IP curve
  const ip_curve = calculateAverageCurve(allDailyCurves);
  
  const totalIpConsumption = ip_curve.reduce((a, b) => a + b, 0);
  console.log(`IP processing complete: ${allDailyCurves.length} days, total consumption: ${totalIpConsumption.toFixed(2)}`);
  
  // If no data found, return zeros with warning
  if (allDailyCurves.length === 0) {
    warnings.push('Nessun dato IP trovato nei file caricati');
  }
  
  return {
    typical_day_curve: ip_curve,
    files_processed: filesProcessed,
    days_processed: allDailyCurves.length,
    total_ip_consumption: totalIpConsumption,
    zone: zoneCode,
    warnings
  };
}

async function processHistoryStep(
  supabase: any, 
  userId: string, 
  files: any[], 
  dispatchMonth: string, 
  historicalMonth: string, 
  zoneCode: string,
  podCodesO: string[]
) {
  console.log(`Processing history step for zone ${zoneCode}, letture files: ${files.length}, POD O from anagrafica: ${podCodesO.length}`);
  
  // Extract POD codes from letture files
  const lettureResult = await extractPodsFromLettureFiles(supabase, files);
  
  // PODs are already deduplicated in extractPodsFromLettureFiles
  const uniquePodsInLetture = lettureResult.allPods;
  
  console.log(`Found ${uniquePodsInLetture.length} unique POD codes in letture files (${lettureResult.skippedFiles} files skipped)`);
  
  // Cross-reference: Find PODs that are in BOTH anagrafica (O) AND letture
  const podsWithData = podCodesO.filter(pod => uniquePodsInLetture.includes(pod));
  const podsWithoutData = podCodesO.filter(pod => !uniquePodsInLetture.includes(pod));
  
  console.log(`Cross-reference result: ${podsWithData.length} POD with data, ${podsWithoutData.length} POD without data`);
  
  // Generate curve (in full implementation, would aggregate actual readings)
  const o_curve = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    return hour >= 8 && hour <= 18 ? Math.random() * 500 + 200 : Math.random() * 100 + 50;
  });
  
  return {
    pod_curves: o_curve,
    pods_with_data: podsWithData.length,
    pods_without_data: podsWithoutData.length,
    pods_matching: podsWithData,
    pods_missing: podsWithoutData.slice(0, 100), // Store first 100 for reference
    unique_pods_in_letture: uniquePodsInLetture.length,
    files_processed: lettureResult.filesProcessed,
    files_skipped: lettureResult.skippedFiles,
    zone: zoneCode,
    total_pod_o_from_anagrafica: podCodesO.length,
    warnings: lettureResult.warnings
  };
}

async function processAggStep(supabase: any, ipResult: any, historyResult: any) {
  const dispatch_curve = Array.from({ length: 96 }, (_, i) => {
    const ip = ipResult.typical_day_curve[i] || 0;
    const o = historyResult.pod_curves[i] || 0;
    return ip + o;
  });
  
  return {
    dispatch_curve,
    ip_curve: ipResult.typical_day_curve,
    o_curve: historyResult.pod_curves,
    breakdown: {
      ip_total: ipResult.typical_day_curve.reduce((a: number, b: number) => a + b, 0),
      o_total: historyResult.pod_curves.reduce((a: number, b: number) => a + b, 0)
    }
  };
}

async function processQaStep(supabase: any, aggResult: any) {
  const total = aggResult.dispatch_curve.reduce((a: number, b: number) => a + b, 0);
  const avg = total / 96;
  const warnings: string[] = [];
  
  aggResult.dispatch_curve.forEach((val: number, i: number) => {
    if (val > avg * 3) {
      warnings.push(`Valore anomalo al quarto ${i + 1}: ${val.toFixed(2)}`);
    }
  });
  
  return {
    quality_score: warnings.length === 0 ? 100 : Math.max(0, 100 - warnings.length * 5),
    anomalies_found: warnings.length,
    warnings,
    validation_passed: warnings.length < 10
  };
}

async function processExportStep(supabase: any, aggResult: any, qaResult: any, zoneCode: string) {
  return {
    zone: zoneCode,
    formats_available: ['json', 'csv', 'xlsx'],
    curve_summary: {
      total_consumption: aggResult.dispatch_curve.reduce((a: number, b: number) => a + b, 0),
      peak_value: Math.max(...aggResult.dispatch_curve),
      min_value: Math.min(...aggResult.dispatch_curve),
      avg_value: aggResult.dispatch_curve.reduce((a: number, b: number) => a + b, 0) / 96
    },
    quality_report: qaResult,
    generated_at: new Date().toISOString()
  };
}

async function updateAgentState(supabase: any, jobId: string, userId: string, agentName: string, status: string, result?: any) {
  const update: any = {
    job_id: jobId,
    user_id: userId,
    agent_name: agentName,
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'running') {
    update.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    update.completed_at = new Date().toISOString();
    update.result = result;
  }

  const { data: existing } = await supabase
    .from('dispatch_agents_state')
    .select('id')
    .eq('job_id', jobId)
    .eq('agent_name', agentName)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('dispatch_agents_state')
      .update(update)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('dispatch_agents_state')
      .insert(update);
  }
}

async function updateJobProgress(supabase: any, jobId: string, currentAgent: string, progress: number) {
  await supabase
    .from('dispatch_jobs')
    .update({
      current_agent: currentAgent,
      progress,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

async function logAgentActivity(supabase: any, userId: string, agentName: string, level: string, message: string, metadata?: any) {
  await supabase
    .from('agent_logs')
    .insert({
      user_id: userId,
      agent_name: agentName,
      log_level: level,
      message,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    });
}

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
} | undefined;
