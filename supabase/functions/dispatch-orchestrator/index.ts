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

    const { zoneCode, dispatchMonth } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user } } = await supabase.auth.getUser(token || '');
    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Starting dispatch orchestration', { user: user.id, zoneCode, dispatchMonth });

    // Calculate T-12 historical month
    const [year, month] = dispatchMonth.split('-').map(Number);
    const historicalYear = year - 1;
    const historicalMonth = `${historicalYear}-${month.toString().padStart(2, '0')}`;

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('dispatch_jobs')
      .insert({
        user_id: user.id,
        zone_code: zoneCode,
        dispatch_month: dispatchMonth,
        historical_month: historicalMonth,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    console.log('Job created:', job.id);

    // Start background orchestration (cast to any to avoid type issues)
    (globalThis as any).EdgeRuntime?.waitUntil(orchestrateAgents(supabase, job.id, user.id, zoneCode, dispatchMonth, historicalMonth));

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        message: 'Elaborazione avviata in background'
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    // Step 1: ANAGRAFICA.INTAKE
    console.log('Step 1: Running ANAGRAFICA.INTAKE');
    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'running');
    await updateJobProgress(supabase, jobId, 'ANAGRAFICA.INTAKE', 10);

    const anagraficaResult = await callAgent(supabase, lovableApiKey, userId, 'ANAGRAFICA.INTAKE', {
      zone: zoneCode,
      files: await getFilesByType(supabase, userId, zoneCode, 'ANAGRAFICA')
    });

    await updateAgentState(supabase, jobId, userId, 'ANAGRAFICA.INTAKE', 'completed', anagraficaResult);

    // Step 2: IP.ASSIMILATOR
    console.log('Step 2: Running IP.ASSIMILATOR');
    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'running');
    await updateJobProgress(supabase, jobId, 'IP.ASSIMILATOR', 25);

    const ipResult = await callAgent(supabase, lovableApiKey, userId, 'IP.ASSIMILATOR', {
      zone: zoneCode,
      historical_month: historicalMonth,
      files: await getFilesByType(supabase, userId, zoneCode, 'AGGR_IP')
    });

    await updateAgentState(supabase, jobId, userId, 'IP.ASSIMILATOR', 'completed', ipResult);

    // Step 3: HISTORY.RESOLVER (for hourly PODs)
    console.log('Step 3: Running HISTORY.RESOLVER');
    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'running');
    await updateJobProgress(supabase, jobId, 'HISTORY.RESOLVER', 40);

    const hourlyPods = anagraficaResult.pods.filter((p: any) => p.meter_type === 'O');
    const historyResult = await callAgent(supabase, lovableApiKey, userId, 'HISTORY.RESOLVER', {
      zone: zoneCode,
      target_month: dispatchMonth,
      historical_month: historicalMonth,
      pods: hourlyPods,
      files: await getFilesByType(supabase, userId, zoneCode, 'PDO')
    });

    await updateAgentState(supabase, jobId, userId, 'HISTORY.RESOLVER', 'completed', historyResult);

    // Step 4: LP.PROFILER (for non-hourly PODs)
    console.log('Step 4: Running LP.PROFILER');
    await updateAgentState(supabase, jobId, userId, 'LP.PROFILER', 'running');
    await updateJobProgress(supabase, jobId, 'LP.PROFILER', 55);

    const lpPods = anagraficaResult.pods.filter((p: any) => p.meter_type === 'LP');
    const lpResult = await callAgent(supabase, lovableApiKey, userId, 'LP.PROFILER', {
      zone: zoneCode,
      target_month: dispatchMonth,
      pods: lpPods
    });

    await updateAgentState(supabase, jobId, userId, 'LP.PROFILER', 'completed', lpResult);

    // Step 5: AGG.SCHEDULER
    console.log('Step 5: Running AGG.SCHEDULER');
    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'running');
    await updateJobProgress(supabase, jobId, 'AGG.SCHEDULER', 70);

    const aggResult = await callAgent(supabase, lovableApiKey, userId, 'AGG.SCHEDULER', {
      zone: zoneCode,
      target_month: dispatchMonth,
      ip_typical_day_curve: ipResult.typical_day_curve,
      hourly_pod_curves: historyResult.pod_curves,
      lp_pod_curves: lpResult.pod_curves
    });

    await updateAgentState(supabase, jobId, userId, 'AGG.SCHEDULER', 'completed', aggResult);

    // Step 6: QA.WATCHDOG
    console.log('Step 6: Running QA.WATCHDOG');
    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'running');
    await updateJobProgress(supabase, jobId, 'QA.WATCHDOG', 85);

    const qaResult = await callAgent(supabase, lovableApiKey, userId, 'QA.WATCHDOG', {
      zone: zoneCode,
      target_month: dispatchMonth,
      dispatch_curve: aggResult.dispatch_typical_day_curve,
      breakdown: aggResult.breakdown,
      all_pods: anagraficaResult.pods
    });

    await updateAgentState(supabase, jobId, userId, 'QA.WATCHDOG', 'completed', qaResult);

    // Step 7: EXPORT.HUB
    console.log('Step 7: Running EXPORT.HUB');
    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'running');
    await updateJobProgress(supabase, jobId, 'EXPORT.HUB', 95);

    const exportResult = await callAgent(supabase, lovableApiKey, userId, 'EXPORT.HUB', {
      zone: zoneCode,
      target_month: dispatchMonth,
      dispatch_curve: aggResult.dispatch_typical_day_curve,
      breakdown: aggResult.breakdown,
      qa_report: qaResult,
      metadata: {
        total_pods: anagraficaResult.pods.length,
        hourly_pods: hourlyPods.length,
        lp_pods: lpPods.length
      }
    });

    await updateAgentState(supabase, jobId, userId, 'EXPORT.HUB', 'completed', exportResult);

    // Save final results
    const { error: resultError } = await supabase
      .from('dispatch_results')
      .insert({
        job_id: jobId,
        user_id: userId,
        zone_code: zoneCode,
        dispatch_month: dispatchMonth,
        curve_96_values: aggResult.dispatch_typical_day_curve,
        ip_curve: aggResult.breakdown.ip,
        o_curve: aggResult.breakdown.hourly,
        lp_curve: aggResult.breakdown.lp,
        total_pods: anagraficaResult.pods.length,
        pods_with_data: historyResult.pod_curves.length + lpResult.pod_curves.length,
        pods_without_data: anagraficaResult.pods.length - (historyResult.pod_curves.length + lpResult.pod_curves.length),
        quality_score: qaResult.overall_quality_score,
        metadata: exportResult
      });

    if (resultError) console.error('Error saving results:', resultError);

    // Update job as completed
    await supabase
      .from('dispatch_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        warnings: [...(anagraficaResult.warnings || []), ...(qaResult.warnings || [])]
      })
      .eq('id', jobId);

    console.log('Orchestration completed successfully');

  } catch (error) {
    console.error('Orchestration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await supabase
      .from('dispatch_jobs')
      .update({
        status: 'failed',
        errors: [{ message: errorMessage, timestamp: new Date().toISOString() }],
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

async function callAgent(supabase: any, lovableApiKey: string, userId: string, agentId: string, inputData: any) {
  // Get agent prompt
  const { data: promptData } = await supabase
    .from('agent_prompts')
    .select('prompt')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .single();

  if (!promptData) {
    throw new Error(`Prompt not found for agent ${agentId}`);
  }

  const systemPrompt = promptData.prompt;
  const userMessage = JSON.stringify(inputData, null, 2);

  console.log(`Calling Lovable AI for ${agentId}`);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI API Error for ${agentId}:`, response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const resultText = data.choices[0].message.content;
  
  try {
    return JSON.parse(resultText);
  } catch (e) {
    console.error(`Failed to parse JSON response from ${agentId}:`, resultText);
    throw new Error(`Invalid JSON response from ${agentId}`);
  }
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
    .single();

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

async function getFilesByType(supabase: any, userId: string, zoneCode: string, fileType: string) {
  const { data: files } = await supabase
    .from('dispatch_files')
    .select('*')
    .eq('user_id', userId)
    .eq('zone_code', zoneCode)
    .eq('file_type', fileType)
    .eq('status', 'uploaded');

  return files || [];
}
