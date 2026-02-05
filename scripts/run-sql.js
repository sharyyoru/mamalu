require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function runSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    return;
  }

  const sql = fs.readFileSync(path.join(__dirname, '../public/upload-contacts/import-leads.sql'), 'utf8');
  
  console.log('Running SQL to import 715 leads...');
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    // Try direct insert instead
    console.log('RPC not available, trying direct insert...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // First delete existing
    const { error: delError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) console.log('Delete error:', delError.message);
    
    // Read and insert leads
    const leads = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/upload-contacts/leads-formatted.json')));
    
    let inserted = 0;
    for (let i = 0; i < leads.length; i += 50) {
      const batch = leads.slice(i, i + 50);
      const { data, error } = await supabase.from('leads').insert(batch).select();
      if (error) {
        console.log(`Batch ${Math.floor(i/50)+1} error:`, error.message);
      } else {
        inserted += data.length;
        process.stdout.write(`\rInserted: ${inserted}/${leads.length}`);
      }
    }
    console.log(`\nDone! Inserted ${inserted} leads`);
  } else {
    console.log('SQL executed successfully!');
  }
}

runSQL().catch(console.error);
