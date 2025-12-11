-- Drop unused dispatch_* tables (legacy system no longer referenced in code)

-- First drop tables with foreign keys
DROP TABLE IF EXISTS public.dispatch_intermediate_results;
DROP TABLE IF EXISTS public.dispatch_agents_state;
DROP TABLE IF EXISTS public.dispatch_results;
DROP TABLE IF EXISTS public.dispatch_jobs;
DROP TABLE IF EXISTS public.dispatch_files;
DROP TABLE IF EXISTS public.dispatch_pods;

-- Finally drop the parent table
DROP TABLE IF EXISTS public.dispatch_zones;