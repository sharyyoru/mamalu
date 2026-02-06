-- Add 'database' to the lead_source enum for imported contacts
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'database';
