const fs = require('fs');
const path = require('path');

const leads = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/upload-contacts/leads-formatted.json')));

const esc = s => s ? "'" + s.replace(/'/g, "''") + "'" : 'NULL';

let sql = `-- Run this in Supabase SQL Editor to import ${leads.length} leads
-- Generated on ${new Date().toISOString()}

-- Clear existing leads first
DELETE FROM leads;

-- Insert new leads
INSERT INTO leads (name, email, phone, company, lead_type, source, status, notes) VALUES
`;

const values = leads.map(l => 
  '(' + [esc(l.name), esc(l.email), esc(l.phone), esc(l.company), esc(l.lead_type), esc(l.source), esc(l.status), esc(l.notes)].join(', ') + ')'
);

sql += values.join(',\n') + ';';

fs.writeFileSync(path.join(__dirname, '../public/upload-contacts/import-leads.sql'), sql);
console.log(`SQL file created with ${leads.length} leads`);
console.log('File: public/upload-contacts/import-leads.sql');
