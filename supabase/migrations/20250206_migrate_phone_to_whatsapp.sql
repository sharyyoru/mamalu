-- Migrate Phone Call leads to WhatsApp source
-- All leads marked as 'phone' source should be 'whatsapp'

UPDATE leads 
SET source = 'whatsapp', 
    updated_at = NOW() 
WHERE source = 'phone';
