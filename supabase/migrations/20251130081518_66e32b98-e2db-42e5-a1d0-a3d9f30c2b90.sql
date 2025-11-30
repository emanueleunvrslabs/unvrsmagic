-- Move user extensions from public to extensions schema
-- This resolves the "Extension in Public" security warning

-- Move uuid-ossp extension to extensions schema
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Move pgcrypto extension to extensions schema  
DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;