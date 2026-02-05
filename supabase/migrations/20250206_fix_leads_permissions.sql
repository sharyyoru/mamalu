-- Fix permissions on leads table for service role
GRANT ALL ON TABLE public.leads TO service_role;
GRANT ALL ON TABLE public.leads TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Disable RLS temporarily for bulk import (you can re-enable after)
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
