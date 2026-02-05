-- Migrate Phone Call leads to WhatsApp source
-- First add whatsapp to the lead_source enum if it doesn't exist
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'whatsapp';

-- Then migrate phone leads to whatsapp
UPDATE leads 
SET source = 'whatsapp', 
    updated_at = NOW() 
WHERE source = 'phone';
