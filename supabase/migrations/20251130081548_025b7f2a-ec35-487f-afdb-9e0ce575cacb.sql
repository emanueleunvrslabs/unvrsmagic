-- Move pg_net extension from public to extensions schema
-- This completes the resolution of "Extension in Public" security warning

DROP EXTENSION IF EXISTS "pg_net" CASCADE;
CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA extensions;