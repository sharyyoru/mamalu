const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '../public/upload-contacts/Regular Customers .xlsx');
const wb = XLSX.readFile(filePath);

// Map sheet names to lead types
const sheetTypeMap = {
  'RegularsBirthday list ': 'birthday',
  'Camp Regulars': 'camp',
  'Nanny Regulars ': 'nanny',
  'Corporate Regular ': 'corporate',
  'School,Nusery': 'school'
};

// Map sheet names to sources
const sheetSourceMap = {
  'RegularsBirthday list ': 'walkin',
  'Camp Regulars': 'walkin',
  'Nanny Regulars ': 'referral',
  'Corporate Regular ': 'phone',
  'School,Nusery': 'website'
};

const allLeads = [];

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue; // Skip empty rows
    
    const name = String(row[0] || '').trim();
    if (!name || name.length < 2) continue;
    
    let contact = String(row[1] || '').trim();
    let email = null;
    let phone = null;
    
    // Determine if contact is email or phone
    if (contact.includes('@')) {
      email = contact;
    } else if (contact) {
      // Clean phone number
      phone = contact.replace(/\s+/g, ' ').trim();
      if (phone && !phone.startsWith('+')) {
        // Add UAE prefix if it looks like a UAE number
        if (phone.startsWith('0')) {
          phone = '+971 ' + phone.substring(1);
        } else if (phone.match(/^5[0-9]/)) {
          phone = '+971 ' + phone;
        }
      }
    }
    
    const notes = row[2] ? String(row[2]).trim() : null;
    const company = sheetName === 'School,Nusery' && row[2] ? String(row[2]).trim() : null;
    
    allLeads.push({
      name,
      email,
      phone,
      company,
      lead_type: sheetTypeMap[sheetName] || 'general',
      source: sheetSourceMap[sheetName] || 'website',
      status: 'new',
      notes: sheetName === 'School,Nusery' ? null : notes
    });
  }
});

// Remove duplicates based on name + phone/email
const seen = new Set();
const uniqueLeads = allLeads.filter(lead => {
  const key = `${lead.name.toLowerCase()}-${lead.phone || lead.email || ''}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`Total leads parsed: ${allLeads.length}`);
console.log(`Unique leads: ${uniqueLeads.length}`);
console.log('\nSample leads:');
uniqueLeads.slice(0, 5).forEach(l => console.log(JSON.stringify(l)));

// Output as JSON for import
const fs = require('fs');
fs.writeFileSync(
  path.join(__dirname, '../public/upload-contacts/leads-formatted.json'),
  JSON.stringify(uniqueLeads, null, 2)
);
console.log('\nFormatted leads saved to leads-formatted.json');
