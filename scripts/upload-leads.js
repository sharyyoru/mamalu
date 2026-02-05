const fs = require('fs');
const path = require('path');

async function uploadLeads() {
  // Read formatted leads
  const leadsPath = path.join(__dirname, '../public/upload-contacts/leads-formatted.json');
  const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
  
  console.log(`Uploading ${leads.length} leads to database...`);
  
  // Use the local API
  const apiUrl = 'http://localhost:3000/api/leads/import';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads, clearExisting: true })
    });
    
    const result = await response.json();
    console.log('Result:', result);
    
    if (result.success) {
      console.log(`✓ Successfully imported ${result.imported} leads`);
    } else {
      console.log('✗ Import failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

uploadLeads();
