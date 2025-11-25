import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Calculate T-12 historical month
    const [year, month] = dispatchMonth.split('-').map(Number);
    const historicalYear = year - 1;
    const historicalMonth = `${historicalYear}-${month.toString().padStart(2, '0')}`;

    // Create a job for each zone
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

      // Start background orchestration for each zone
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

    // Get user files for this specific zone
    const { data: userFiles, error: filesError } = await supabase
      .from('dispatch_files')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'uploaded');

    if (filesError) {
      throw new Error(`Error fetching files: ${filesError.message}`);
    }

    console.log(`Found ${userFiles?.length || 0} files for user`);

    // Filter files by zone where applicable
    const anagraficaFiles = userFiles?.filter((f: any) => 
      f.file_type === 'ANAGRAFICA' && (f.zone_code === zoneCode || !f.zone_code)
    ) || [];
    const ipFiles = userFiles?.filter((f: any) => f.file_type === 'AGGR_IP') || [];
    const ipDetailFiles = userFiles?.filter((f: any) => f.file_type === 'IP_DETAIL') || [];
    const lettureFiles = userFiles?.filter((f: any) => f.file_type === 'LETTURE') || [];

    // Step 1: ANAGRAFICA.INTAKE (10%)
    await updateJobProgress(supabase, jobId, 'ANAGRAFICA.INTAKE', 10);
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'running');
    await logAgentActivity(supabase, userId, 'ANAGRAFICA.INTAKE', 'info', `Elaborazione anagrafica POD zona ${zoneCode}`, { files: anagraficaFiles.length, zone: zoneCode });
    
    const anagraficaResult = await processAnagraficaStep(supabase, userId, anagraficaFiles, ipDetailFiles, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'completed', anagraficaResult);

    // Step 2: IP.ASSIMILATOR (25%)
    await updateJobProgress(supabase, jobId, 'IP.ASSIMILATOR', 25);
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'running');
    await logAgentActivity(supabase, userId, 'IP.ASSIMILATOR', 'info', `Elaborazione illuminazione pubblica zona ${zoneCode}`, { files: ipFiles.length });
    
    const ipResult = await processIpStep(supabase, userId, ipFiles, historicalMonth, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'completed', ipResult);

    // Step 3: HISTORY.RESOLVER (40%)
    await updateJobProgress(supabase, jobId, 'HISTORY.RESOLVER', 40);
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'running');
    await logAgentActivity(supabase, userId, 'HISTORY.RESOLVER', 'info', `Elaborazione POD orari zona ${zoneCode}`, { files: lettureFiles.length });
    
    const historyResult = await processHistoryStep(supabase, userId, lettureFiles, dispatchMonth, historicalMonth, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'completed', historyResult);

    // Step 4: LP.PROFILER (55%)
    await updateJobProgress(supabase, jobId, 'LP.PROFILER', 55);
    await updateAgentState(supabase, jobId, userId, 'LP.PROFILER', 'running');
    await logAgentActivity(supabase, userId, 'LP.PROFILER', 'info', `Applicazione profili di carico zona ${zoneCode}`);
    
    const lpResult = await processLpStep(supabase, userId, dispatchMonth, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'LP.PROFILER', 'completed', lpResult);

    // Step 5: AGG.SCHEDULER (70%)
    await updateJobProgress(supabase, jobId, 'AGG.SCHEDULER', 70);
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'running');
    await logAgentActivity(supabase, userId, 'AGG.SCHEDULER', 'info', `Aggregazione curve zona ${zoneCode}`);
    
    const aggResult = await processAggStep(supabase, ipResult, historyResult, lpResult);
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'completed', aggResult);

    // Step 6: QA.WATCHDOG (85%)
    await updateJobProgress(supabase, jobId, 'QA.WATCHDOG', 85);
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'running');
    await logAgentActivity(supabase, userId, 'QA.WATCHDOG', 'info', `Controllo qualità dati zona ${zoneCode}`);
    
    const qaResult = await processQaStep(supabase, aggResult);
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'completed', qaResult);

    // Step 7: EXPORT.HUB (95%)
    await updateJobProgress(supabase, jobId, 'EXPORT.HUB', 95);
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'running');
    await logAgentActivity(supabase, userId, 'EXPORT.HUB', 'info', `Generazione output zona ${zoneCode}`);
    
    const exportResult = await processExportStep(supabase, aggResult, qaResult, zoneCode);
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'completed', exportResult);

    // Save final results for this zone
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
        lp_curve: aggResult.lp_curve,
        total_pods: anagraficaResult.total_pods,
        pods_with_data: historyResult.pods_with_data,
        pods_without_data: anagraficaResult.total_pods - historyResult.pods_with_data,
        quality_score: qaResult.quality_score,
        metadata: { ...exportResult, zone: zoneCode }
      });

    if (resultError) {
      console.error('Error saving results for zone:', zoneCode, resultError);
    }

    // Update job as completed
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

// Processing step functions
async function processAnagraficaStep(supabase: any, userId: string, files: any[], ipDetailFiles: any[], zoneCode: string) {
  // In real implementation, would parse files and deduct IP PODs
  return {
    total_pods: files.length > 0 ? 150 : 0,
    pods_by_type: { O: 50, LP: 100 },
    zone: zoneCode,
    ip_pods_deducted: ipDetailFiles.length > 0 ? 20 : 0,
    warnings: []
  };
}

async function processIpStep(supabase: any, userId: string, files: any[], historicalMonth: string, zoneCode: string) {
  const ip_curve = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    return hour >= 18 || hour <= 6 ? Math.random() * 100 + 50 : Math.random() * 20;
  });
  
  return {
    typical_day_curve: ip_curve,
    files_processed: files.length,
    zone: zoneCode,
    warnings: []
  };
}

async function processHistoryStep(supabase: any, userId: string, files: any[], dispatchMonth: string, historicalMonth: string, zoneCode: string) {
  const o_curve = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    return hour >= 8 && hour <= 18 ? Math.random() * 500 + 200 : Math.random() * 100 + 50;
  });
  
  return {
    pod_curves: o_curve,
    pods_with_data: 45,
    files_processed: files.length,
    zone: zoneCode,
    warnings: []
  };
}

async function processLpStep(supabase: any, userId: string, dispatchMonth: string, zoneCode: string) {
  const lp_curve = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    return (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 22) 
      ? Math.random() * 300 + 150 
      : Math.random() * 100 + 30;
  });
  
  return {
    pod_curves: lp_curve,
    pods_processed: 100,
    zone: zoneCode,
    warnings: []
  };
}

async function processAggStep(supabase: any, ipResult: any, historyResult: any, lpResult: any) {
  const dispatch_curve = Array.from({ length: 96 }, (_, i) => {
    const ip = ipResult.typical_day_curve[i] || 0;
    const o = historyResult.pod_curves[i] || 0;
    const lp = lpResult.pod_curves[i] || 0;
    return ip + o + lp;
  });
  
  return {
    dispatch_curve,
    ip_curve: ipResult.typical_day_curve,
    o_curve: historyResult.pod_curves,
    lp_curve: lpResult.pod_curves,
    breakdown: {
      ip_total: ipResult.typical_day_curve.reduce((a: number, b: number) => a + b, 0),
      o_total: historyResult.pod_curves.reduce((a: number, b: number) => a + b, 0),
      lp_total: lpResult.pod_curves.reduce((a: number, b: number) => a + b, 0)
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
