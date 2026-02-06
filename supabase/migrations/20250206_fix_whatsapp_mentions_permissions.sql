-- Fix permissions for whatsapp_cash_mentions table
-- The WhatsApp server uses service_role key which needs explicit GRANT
GRANT ALL ON whatsapp_cash_mentions TO service_role;
GRANT ALL ON whatsapp_cash_mentions TO authenticated;

-- Also disable RLS so service_role can always access
ALTER TABLE whatsapp_cash_mentions DISABLE ROW LEVEL SECURITY;
