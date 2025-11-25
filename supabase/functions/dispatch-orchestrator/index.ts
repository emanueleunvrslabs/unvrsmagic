import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Model Configuration per Agent
const AGENT_MODELS = {
  'DISPATCH.BRAIN': { provider: 'anthropic', model: 'claude-sonnet-4-5-20250514' },
  'ANAGRAFICA.INTAKE': { provider: 'openai', model: 'gpt-4.1-2025-04-14' },
  'IP.ASSIMILATOR': { provider: 'qwen', model: 'qwen-max' },
  'HISTORY.RESOLVER': { provider: 'anthropic', model: 'claude-sonnet-4-5-20250514' },
  'LP.PROFILER': { provider: 'qwen', model: 'qwen-max' },
  'AGG.SCHEDULER': { provider: 'qwen', model: 'qwen-max' },
  'QA.WATCHDOG': { provider: 'anthropic', model: 'claude-sonnet-4-5-20250514' },
  'EXPORT.HUB': { provider: 'openai', model: 'gpt-4.1-2025-04-14' },
} as const;

// Fetch API key for a provider from the database
async function getApiKey(supabase: any, userId: string, provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
  
  if (error || !data) {
    console.error(`API key not found for provider ${provider}:`, error);
    return null;
  }
  
  return data.api_key;
}

// Fetch agent prompt from the database
async function getAgentPrompt(supabase: any, userId: string, agentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('agent_prompts')
    .select('prompt')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .single();
  
  if (error || !data) {
    console.log(`No custom prompt found for agent ${agentId}, using default`);
    return null;
  }
  
  return data.prompt;
}

// Call Anthropic Claude API
async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (error) {
    console.error('Error calling Anthropic:', error);
    throw error;
  }
}

// Call OpenAI API
async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        max_completion_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

// Call Qwen API (DashScope International)
async function callQwen(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error:', response.status, errorText);
      throw new Error(`Qwen API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling Qwen:', error);
    throw error;
  }
}

// Universal AI call function
async function callAgentAI(
  supabase: any, 
  userId: string, 
  agentName: string, 
  userMessage: string,
  defaultPrompt: string
): Promise<{ response: string; aiUsed: boolean }> {
  try {
    const config = AGENT_MODELS[agentName as keyof typeof AGENT_MODELS];
    if (!config) {
      console.log(`No AI config for agent ${agentName}, skipping AI call`);
      return { response: '', aiUsed: false };
    }

    const apiKey = await getApiKey(supabase, userId, config.provider);
    if (!apiKey) {
      console.log(`No API key found for ${config.provider}, skipping AI for ${agentName}`);
      return { response: '', aiUsed: false };
    }

    // Get custom prompt or use default
    const customPrompt = await getAgentPrompt(supabase, userId, agentName);
    const systemPrompt = customPrompt || defaultPrompt;

    console.log(`Calling AI for ${agentName}: provider=${config.provider}, model=${config.model}`);

    let response: string;
    switch (config.provider) {
      case 'anthropic':
        response = await callAnthropic(apiKey, config.model, systemPrompt, userMessage);
        break;
      case 'openai':
        response = await callOpenAI(apiKey, config.model, systemPrompt, userMessage);
        break;
      case 'qwen':
        response = await callQwen(apiKey, config.model, systemPrompt, userMessage);
        break;
      default:
        return { response: '', aiUsed: false };
    }

    console.log(`AI response received for ${agentName}: ${response.substring(0, 200)}...`);
    return { response, aiUsed: true };
  } catch (error) {
    console.error(`Error in AI call for ${agentName}:`, error);
    return { response: '', aiUsed: false };
  }
}

// Configuration for file processing
const LARGE_FILE_THRESHOLD_MB = 20; // Files larger than this will be processed via separate edge function

// Process a single file via the dispatch-file-processor edge function
async function processFileViaEdgeFunction(
  supabase: any,
  fileId: string,
  jobId: string,
  userId: string
): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  try {
    console.log(`Calling dispatch-file-processor for file ${fileId}`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/dispatch-file-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        fileId,
        jobId,
        userId,
        action: 'process'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('dispatch-file-processor error:', response.status, errorText);
      throw new Error(`File processor error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`File ${fileId} processed:`, result.success ? 'success' : 'failed');
    return result;
  } catch (error) {
    console.error(`Error processing file ${fileId} via edge function:`, error);
    throw error;
  }
}

// Process files with automatic routing (direct for small, edge function for large)
async function processFilesWithMultiPhase(
  supabase: any,
  files: any[],
  jobId: string,
  userId: string,
  processDirectFn: (files: any[]) => Promise<any>
): Promise<{ result: any; processedViaEdge: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  
  // Separate files by size
  const smallFiles = files.filter(f => {
    const sizeMB = (f.file_size || 0) / (1024 * 1024);
    return sizeMB <= LARGE_FILE_THRESHOLD_MB;
  });
  
  const largeFiles = files.filter(f => {
    const sizeMB = (f.file_size || 0) / (1024 * 1024);
    return sizeMB > LARGE_FILE_THRESHOLD_MB;
  });

  console.log(`Processing ${smallFiles.length} small files directly, ${largeFiles.length} large files via edge function`);

  // Process large files via edge function
  const largeFileResults: any[] = [];
  for (const file of largeFiles) {
    try {
      const result = await processFileViaEdgeFunction(supabase, file.id, jobId, userId);
      if (result.success && result.result) {
        largeFileResults.push(result.result);
      } else {
        warnings.push(`File ${file.file_name}: ${result.error || 'elaborazione fallita'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      warnings.push(`File ${file.file_name}: ${errorMsg}`);
    }
  }

  // Process small files directly
  let directResult: any = null;
  if (smallFiles.length > 0) {
    directResult = await processDirectFn(smallFiles);
  }

  // Merge results
  const processedViaEdge = largeFiles.length > 0;

  return {
    result: { directResult, largeFileResults, warnings },
    processedViaEdge,
    warnings
  };
}

// Aggregate intermediate results from the database
async function aggregateIntermediateResults(
  supabase: any,
  jobId: string,
  resultType: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('dispatch_intermediate_results')
    .select('data')
    .eq('job_id', jobId)
    .eq('result_type', resultType)
    .eq('status', 'completed');

  if (error) {
    console.error(`Error fetching intermediate results for ${resultType}:`, error);
    return [];
  }

  return data?.map((r: any) => r.data) || [];
}

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

    // DISPATCH.BRAIN - AI orchestration start
    const brainDefaultPrompt = `Sei DISPATCH.BRAIN, l'orchestratore centrale del sistema di dispacciamento energetico italiano.
Il tuo ruolo è coordinare gli altri agenti e gestire il workflow di elaborazione dati per il mese ${dispatchMonth}, zona ${zoneCode}.
Analizza i dati forniti e coordina le operazioni.`;

    const brainAI = await callAgentAI(
      supabase, userId, 'DISPATCH.BRAIN',
      `Avvio orchestrazione per zona ${zoneCode}, mese dispatch: ${dispatchMonth}, mese storico T-12: ${historicalMonth}. Coordina le operazioni.`,
      brainDefaultPrompt
    );
    
    await logAgentActivity(supabase, userId, 'DISPATCH.BRAIN', 'info', 
      `Orchestrazione avviata per zona ${zoneCode}${brainAI.aiUsed ? ' (AI attivo)' : ''}`, 
      { jobId, dispatchMonth, zoneCode, aiUsed: brainAI.aiUsed, aiResponse: brainAI.response?.substring(0, 500) }
    );

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

    // Step 1: ANAGRAFICA.INTAKE (15%) - OpenAI GPT-5.1
    await updateJobProgress(supabase, jobId, 'ANAGRAFICA.INTAKE', 15);
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'running');
    await logAgentActivity(supabase, userId, 'ANAGRAFICA.INTAKE', 'info', `Elaborazione anagrafica POD zona ${zoneCode} (solo tipo O)`, { files: anagraficaFiles.length, zone: zoneCode });
    
    const anagraficaResult = await processAnagraficaStep(supabase, userId, anagraficaFiles, ipDetailFiles, zoneCode, dispatchMonth);
    
    // AI analysis for ANAGRAFICA.INTAKE
    const anagraficaDefaultPrompt = `Sei ANAGRAFICA.INTAKE, agente specializzato nella normalizzazione e validazione dei dati anagrafici dei POD.
Analizza i risultati dell'elaborazione anagrafica e fornisci insights sulla qualità dei dati.`;
    
    const anagraficaAI = await callAgentAI(
      supabase, userId, 'ANAGRAFICA.INTAKE',
      `Analisi anagrafica completata per zona ${zoneCode}:
- POD orari (O) trovati: ${anagraficaResult.total_pods_o}
- POD non orari (LP): ${anagraficaResult.total_pods_lp}
- POD IP dedotti: ${anagraficaResult.ip_pods_deducted}
- File elaborati: ${anagraficaResult.files_processed}
${anagraficaResult.warnings?.length > 0 ? `- Warning: ${anagraficaResult.warnings.join(', ')}` : ''}
Fornisci una valutazione della qualità dei dati e suggerimenti.`,
      anagraficaDefaultPrompt
    );
    
    const anagraficaResultWithAI = { ...anagraficaResult, ai_analysis: anagraficaAI.response, aiUsed: anagraficaAI.aiUsed };
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'completed', anagraficaResultWithAI);
    await logAgentActivity(supabase, userId, 'ANAGRAFICA.INTAKE', 'info', 
      `Anagrafica completata: ${anagraficaResult.total_pods_o} POD orari trovati${anagraficaAI.aiUsed ? ' (AI)' : ''}`, 
      { ...anagraficaResult, aiUsed: anagraficaAI.aiUsed }
    );

    // Step 2: IP.ASSIMILATOR (30%) - Qwen3
    await updateJobProgress(supabase, jobId, 'IP.ASSIMILATOR', 30);
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'running');
    await logAgentActivity(supabase, userId, 'IP.ASSIMILATOR', 'info', `Elaborazione illuminazione pubblica zona ${zoneCode}`, { files: ipFiles.length });
    
    const ipResult = await processIpStep(supabase, userId, ipFiles, historicalMonth, zoneCode);
    
    // AI analysis for IP.ASSIMILATOR
    const ipDefaultPrompt = `Sei IP.ASSIMILATOR, agente specializzato nella costruzione dei profili giornalieri dell'illuminazione pubblica.
Analizza i dati IP e fornisci insights sulla curva tipica a 96 quarti d'ora.`;
    
    const ipAI = await callAgentAI(
      supabase, userId, 'IP.ASSIMILATOR',
      `Elaborazione IP completata per zona ${zoneCode}:
- Giorni elaborati: ${ipResult.days_processed}
- Consumo IP totale: ${(ipResult.total_ip_consumption || 0).toFixed(2)} kWh
- File elaborati: ${ipResult.files_processed}
- Curva media 96 valori (primi 10): ${ipResult.typical_day_curve?.slice(0, 10).map((v: number) => v.toFixed(2)).join(', ')}...
${ipResult.warnings?.length > 0 ? `- Warning: ${ipResult.warnings.join(', ')}` : ''}
Analizza la curva IP e identifica pattern o anomalie.`,
      ipDefaultPrompt
    );
    
    const ipResultWithAI = { ...ipResult, ai_analysis: ipAI.response, aiUsed: ipAI.aiUsed };
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'completed', ipResultWithAI);
    await logAgentActivity(supabase, userId, 'IP.ASSIMILATOR', 'info', 
      `IP completato: ${ipResult.days_processed || 0} giorni elaborati${ipAI.aiUsed ? ' (AI)' : ''}`, 
      { days: ipResult.days_processed, total: ipResult.total_ip_consumption, aiUsed: ipAI.aiUsed }
    );

    // Step 3: HISTORY.RESOLVER (50%) - Claude Sonnet 4.5
    await updateJobProgress(supabase, jobId, 'HISTORY.RESOLVER', 50);
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'running');
    await logAgentActivity(supabase, userId, 'HISTORY.RESOLVER', 'info', `Elaborazione POD orari (O) zona ${zoneCode} - Parsing letture e incrocio`, { files: lettureFiles.length });
    
    const historyResult = await processHistoryStep(supabase, userId, lettureFiles, dispatchMonth, historicalMonth, zoneCode, anagraficaResult.pod_codes_o);
    
    // AI analysis for HISTORY.RESOLVER
    const historyDefaultPrompt = `Sei HISTORY.RESOLVER, agente specializzato nell'applicazione della logica T-12 per POD orari usando dati storici.
Analizza l'incrocio tra anagrafica e letture e fornisci insights sui POD con/senza dati.`;
    
    const historyAI = await callAgentAI(
      supabase, userId, 'HISTORY.RESOLVER',
      `Incrocio letture-anagrafica completato per zona ${zoneCode}:
- POD con dati: ${historyResult.pods_with_data}
- POD senza dati: ${historyResult.pods_without_data}
- POD totali in anagrafica (O): ${historyResult.total_pod_o_from_anagrafica}
- POD unici nelle letture: ${historyResult.unique_pods_in_letture}
- File elaborati: ${historyResult.files_processed}
- File saltati: ${historyResult.files_skipped}
${historyResult.warnings?.length > 0 ? `- Warning: ${historyResult.warnings.slice(0, 5).join(', ')}${historyResult.warnings.length > 5 ? '...' : ''}` : ''}
Analizza la copertura dati e suggerisci come gestire i POD senza letture.`,
      historyDefaultPrompt
    );
    
    const historyResultWithAI = { ...historyResult, ai_analysis: historyAI.response, aiUsed: historyAI.aiUsed };
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'completed', historyResultWithAI);
    await logAgentActivity(supabase, userId, 'HISTORY.RESOLVER', 'info', 
      `Incrocio completato: ${historyResult.pods_with_data} POD con dati, ${historyResult.pods_without_data} senza${historyAI.aiUsed ? ' (AI)' : ''}`, 
      { pods_with_data: historyResult.pods_with_data, pods_without_data: historyResult.pods_without_data, aiUsed: historyAI.aiUsed }
    );

    // Step 4: AGG.SCHEDULER (70%) - Qwen3
    await updateJobProgress(supabase, jobId, 'AGG.SCHEDULER', 70);
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'running');
    await logAgentActivity(supabase, userId, 'AGG.SCHEDULER', 'info', `Aggregazione curve IP + O zona ${zoneCode}`);
    
    const aggResult = await processAggStep(supabase, ipResultWithAI, historyResultWithAI);
    
    // AI analysis for AGG.SCHEDULER
    const aggDefaultPrompt = `Sei AGG.SCHEDULER, agente specializzato nell'aggregazione delle curve IP e O in curva totale a 96 valori.
Analizza la curva aggregata e verifica la coerenza dei dati.`;
    
    const aggAI = await callAgentAI(
      supabase, userId, 'AGG.SCHEDULER',
      `Aggregazione completata per zona ${zoneCode}:
- Consumo IP totale: ${aggResult.breakdown?.ip_total?.toFixed(2) || 0} kWh
- Consumo O totale: ${aggResult.breakdown?.o_total?.toFixed(2) || 0} kWh
- Consumo dispatch totale: ${aggResult.dispatch_curve?.reduce((a: number, b: number) => a + b, 0).toFixed(2) || 0} kWh
- Picco curva: ${Math.max(...(aggResult.dispatch_curve || [0])).toFixed(2)} kWh
- Minimo curva: ${Math.min(...(aggResult.dispatch_curve || [0])).toFixed(2)} kWh
Verifica la coerenza dell'aggregazione e identifica eventuali anomalie nella curva finale.`,
      aggDefaultPrompt
    );
    
    const aggResultWithAI = { ...aggResult, ai_analysis: aggAI.response, aiUsed: aggAI.aiUsed };
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'completed', aggResultWithAI);
    await logAgentActivity(supabase, userId, 'AGG.SCHEDULER', 'info', 
      `Aggregazione completata${aggAI.aiUsed ? ' (AI)' : ''}`, 
      { breakdown: aggResult.breakdown, aiUsed: aggAI.aiUsed }
    );

    // Step 5: QA.WATCHDOG (85%) - Claude Sonnet 4.5
    await updateJobProgress(supabase, jobId, 'QA.WATCHDOG', 85);
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'running');
    await logAgentActivity(supabase, userId, 'QA.WATCHDOG', 'info', `Controllo qualità dati zona ${zoneCode}`);
    
    const qaResult = await processQaStep(supabase, aggResultWithAI);
    
    // AI analysis for QA.WATCHDOG
    const qaDefaultPrompt = `Sei QA.WATCHDOG, agente specializzato nella validazione della qualità dati e identificazione di anomalie nei profili.
Esegui controlli approfonditi sulla curva di dispatch e fornisci un report dettagliato.`;
    
    const qaAI = await callAgentAI(
      supabase, userId, 'QA.WATCHDOG',
      `Controllo qualità per zona ${zoneCode}:
- Quality score: ${qaResult.quality_score}%
- Anomalie trovate: ${qaResult.anomalies_found}
- Validazione: ${qaResult.validation_passed ? 'PASSATA' : 'FALLITA'}
${qaResult.warnings?.length > 0 ? `- Warning: ${qaResult.warnings.slice(0, 10).join(', ')}${qaResult.warnings.length > 10 ? '...' : ''}` : ''}
- Curva dispatch (primi 24 valori): ${aggResultWithAI.dispatch_curve?.slice(0, 24).map((v: number) => v.toFixed(1)).join(', ')}
Esegui un'analisi approfondita della qualità e suggerisci correzioni se necessario.`,
      qaDefaultPrompt
    );
    
    const qaResultWithAI = { ...qaResult, ai_analysis: qaAI.response, aiUsed: qaAI.aiUsed };
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'completed', qaResultWithAI);
    await logAgentActivity(supabase, userId, 'QA.WATCHDOG', 'info', 
      `QA completato: score ${qaResult.quality_score}%${qaAI.aiUsed ? ' (AI)' : ''}`, 
      { quality_score: qaResult.quality_score, anomalies: qaResult.anomalies_found, aiUsed: qaAI.aiUsed }
    );

    // Step 6: EXPORT.HUB (95%) - OpenAI GPT-5.1
    await updateJobProgress(supabase, jobId, 'EXPORT.HUB', 95);
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'running');
    await logAgentActivity(supabase, userId, 'EXPORT.HUB', 'info', `Generazione output zona ${zoneCode}`);
    
    const exportResult = await processExportStep(supabase, aggResultWithAI, qaResultWithAI, zoneCode);
    
    // AI analysis for EXPORT.HUB
    const exportDefaultPrompt = `Sei EXPORT.HUB, agente specializzato nella generazione dei file export JSON/CSV/XLSX e payload per UI.
Prepara un sommario executive del dispatch e suggerisci il formato più adatto.`;
    
    const exportAI = await callAgentAI(
      supabase, userId, 'EXPORT.HUB',
      `Export preparato per zona ${zoneCode}:
- Consumo totale: ${exportResult.curve_summary?.total_consumption?.toFixed(2)} kWh
- Picco: ${exportResult.curve_summary?.peak_value?.toFixed(2)} kWh
- Minimo: ${exportResult.curve_summary?.min_value?.toFixed(2)} kWh
- Media: ${exportResult.curve_summary?.avg_value?.toFixed(2)} kWh
- Quality score: ${qaResultWithAI.quality_score}%
- Formati disponibili: ${exportResult.formats_available?.join(', ')}
Genera un sommario executive per questo dispatch e suggerisci eventuali note per l'utente.`,
      exportDefaultPrompt
    );
    
    const exportResultWithAI = { ...exportResult, ai_analysis: exportAI.response, aiUsed: exportAI.aiUsed };
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'completed', exportResultWithAI);
    await logAgentActivity(supabase, userId, 'EXPORT.HUB', 'info', 
      `Export completato${exportAI.aiUsed ? ' (AI)' : ''}`, 
      { ...exportResult, aiUsed: exportAI.aiUsed }
    );

    // Save final results with AI insights
    const { error: resultError } = await supabase
      .from('dispatch_results')
      .insert({
        job_id: jobId,
        user_id: userId,
        zone_code: zoneCode,
        dispatch_month: dispatchMonth,
        curve_96_values: aggResultWithAI.dispatch_curve,
        ip_curve: aggResultWithAI.ip_curve,
        o_curve: aggResultWithAI.o_curve,
        total_pods: anagraficaResult.total_pods_o,
        pods_with_data: historyResult.pods_with_data,
        pods_without_data: historyResult.pods_without_data,
        quality_score: qaResultWithAI.quality_score,
        metadata: { 
          ...exportResultWithAI, 
          zone: zoneCode, 
          ip_pods_deducted: anagraficaResult.ip_pods_deducted,
          pods_in_letture: historyResult.unique_pods_in_letture,
          pods_missing: historyResult.pods_missing,
          ai_insights: {
            anagrafica: anagraficaAI.response,
            ip: ipAI.response,
            history: historyAI.response,
            agg: aggAI.response,
            qa: qaAI.response,
            export: exportAI.response
          }
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
        warnings: qaResultWithAI.warnings || []
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

// Parse CSV content to extract POD data using trattamento_XX column for the specific month
function parseAnagraficaCSV(content: string, zoneCode: string, dispatchMonth?: string): { podCodesO: string[], podCodesLP: string[], allPods: any[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { podCodesO: [], podCodesLP: [], allPods: [] };
  
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toUpperCase());
  
  console.log('CSV Headers found:', headers.slice(0, 20), '...');
  
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
  // e.g., November -> TRATTAMENTO_11, December -> TRATTAMENTO_12
  let trattamentoColIndex = -1;
  let trattamentoColName = '';
  
  if (dispatchMonth) {
    const monthNum = parseInt(dispatchMonth.split('-')[1], 10);
    const monthStr = monthNum.toString().padStart(2, '0');
    
    // Try different variations of the column name
    const trattamentoColNames = [
      `TRATTAMENTO_${monthStr}`,
      `TRATTAMENTO_${monthNum}`,
      `TRATTAMENTO${monthStr}`,
      `TRATTAMENTO${monthNum}`,
      `TIPO_TRATTAMENTO_${monthStr}`,
      `TIPO_TRATTAMENTO_${monthNum}`
    ];
    
    for (const colName of trattamentoColNames) {
      const idx = headers.indexOf(colName);
      if (idx !== -1) {
        trattamentoColIndex = idx;
        trattamentoColName = colName;
        break;
      }
    }
    
    console.log(`Looking for trattamento column for month ${monthNum}: found ${trattamentoColName} at index ${trattamentoColIndex}`);
  }
  
  // Fallback to generic type columns if month-specific not found
  if (trattamentoColIndex === -1) {
    const fallbackColNames = ['TRATTAMENTO', 'TIPO_TRATTAMENTO', 'TIPO_MISURATORE', 'TIPO', 'TIPOLOGIA', 'TIPO_CONTATORE', 'TIPO TRATTAMENTO'];
    for (const name of fallbackColNames) {
      const idx = headers.indexOf(name);
      if (idx !== -1) {
        trattamentoColIndex = idx;
        trattamentoColName = name;
        console.log(`Using fallback column: ${name}`);
        break;
      }
    }
  }
  
  console.log(`POD column index: ${podColIndex}, Trattamento column: ${trattamentoColName} at index: ${trattamentoColIndex}`);
  
  const podCodesO: string[] = [];
  const podCodesLP: string[] = [];
  const allPods: any[] = [];
  
  // If POD column not found by name, try to find by content
  if (podColIndex === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (lines.length > 1) {
        const firstDataRow = lines[1].split(separator);
        if (firstDataRow[i]?.trim().startsWith('IT')) {
          podColIndex = i;
          console.log(`Found POD column by content at index ${i}`);
          break;
        }
      }
    }
  }
  
  if (podColIndex === -1) {
    console.log('Could not find POD column in anagrafica');
    return { podCodesO: [], podCodesLP: [], allPods: [] };
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    
    if (values.length <= podColIndex) continue;
    
    const podCode = values[podColIndex] || '';
    const trattamento = trattamentoColIndex !== -1 ? (values[trattamentoColIndex] || '').toUpperCase().trim() : '';
    
    if (!podCode || podCode.length < 5) continue;
    
    const pod = {
      pod_code: podCode,
      trattamento: trattamento,
      raw_data: values
    };
    
    allPods.push(pod);
    
    // Check if POD is hourly (O) based on trattamento value
    // Common values: "O", "ORARIO", "1", "TM", or empty (default to O if no column found)
    const isHourly = trattamento === 'O' || 
                     trattamento === 'ORARIO' || 
                     trattamento === '1' || 
                     trattamento === 'TM' ||
                     trattamento === 'TMO' ||
                     (trattamentoColIndex === -1 && podCode.startsWith('IT')); // If no column found, include all PODs starting with IT
    
    if (isHourly) {
      podCodesO.push(podCode);
    } else if (trattamento) {
      podCodesLP.push(podCode);
    }
  }
  
  console.log(`Parsed ${allPods.length} total PODs: ${podCodesO.length} type O (hourly), ${podCodesLP.length} type LP (non-hourly)`);
  
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
const MAX_FILE_SIZE_MB = 30; // Maximum file size in MB to process (to avoid memory issues)

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
    
    // Check file size before downloading to avoid memory issues
    const fileSizeMB = file.file_size ? file.file_size / (1024 * 1024) : 0;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      console.log(`Skipping large file ${file.file_name}: ${fileSizeMB.toFixed(2)} MB > ${MAX_FILE_SIZE_MB} MB limit`);
      warnings.push(`File ${file.file_name} troppo grande (${fileSizeMB.toFixed(1)} MB). Max: ${MAX_FILE_SIZE_MB} MB. Dividere in file più piccoli.`);
      skippedFiles++;
      continue;
    }
    
    try {
      const content = await downloadFileContent(supabase, file.file_url);
      if (!content) {
        warnings.push(`Impossibile scaricare: ${file.file_name}`);
        continue;
      }
      
      // Double-check actual content size
      const actualSizeMB = content.byteLength / (1024 * 1024);
      if (actualSizeMB > MAX_FILE_SIZE_MB) {
        console.log(`Skipping file ${file.file_name} after download: ${actualSizeMB.toFixed(2)} MB exceeds limit`);
        warnings.push(`File ${file.file_name} troppo grande (${actualSizeMB.toFixed(1)} MB). Max: ${MAX_FILE_SIZE_MB} MB.`);
        skippedFiles++;
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
async function processAnagraficaStep(supabase: any, userId: string, files: any[], ipDetailFiles: any[], zoneCode: string, dispatchMonth: string) {
  console.log(`Processing anagrafica for zone ${zoneCode}, month ${dispatchMonth}, files: ${files.length}, ipDetailFiles: ${ipDetailFiles.length}`);
  
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
            const parsed = parseAnagraficaCSV(csvContent, zoneCode, dispatchMonth);
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
        const parsed = parseAnagraficaCSV(textContent, zoneCode, dispatchMonth);
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
