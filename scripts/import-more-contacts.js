require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE_DIR = path.join(__dirname, '..', 'public', 'upload-contacts', 'morecontacts');

// Normalize phone numbers for dedup comparison
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/[^0-9+]/g, '');
  // Remove leading zeros after country code
  if (p.startsWith('0')) p = '+971' + p.substring(1);
  return p || null;
}

// Normalize email for dedup
function normalizeEmail(email) {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  return e.includes('@') ? e : null;
}

// Clean name
function cleanName(name) {
  if (!name) return null;
  return String(name).trim().replace(/\s+/g, ' ');
}

// ========== PARSERS ==========

function parseSchoolDatabase() {
  const wb = XLSX.readFile(path.join(BASE_DIR, 'School Database UD.xlsx'));
  const data = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });
  const leads = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const schoolName = cleanName(row[0]);
    const contactDetails = row[1] ? String(row[1]).trim() : null;
    const comments = row[2] ? String(row[2]).trim() : null;
    const contactName = cleanName(row[3]);

    // Contact details could be phone or email
    let phone = null;
    let email = null;
    if (contactDetails) {
      if (contactDetails.includes('@')) {
        email = normalizeEmail(contactDetails);
      } else {
        phone = contactDetails;
      }
    }

    leads.push({
      name: contactName || schoolName,
      email,
      phone,
      company: schoolName,
      lead_type: 'school',
      source: 'website',
      status: 'new',
      notes: comments || null,
    });
  }
  return leads;
}

function parseDatabaseForCRM() {
  const wb = XLSX.readFile(path.join(BASE_DIR, 'database for CRM.xlsx'));
  const data = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });
  const leads = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || (!row[0] && !row[2] && !row[3])) continue;

    const firstName = cleanName(row[0]);
    const lastName = cleanName(row[1]);
    const email = normalizeEmail(row[2]);
    const phone = row[3] ? String(row[3]).trim() : null;

    const name = [firstName, lastName].filter(Boolean).join(' ');
    if (!name) continue;

    leads.push({
      name,
      email,
      phone,
      company: null,
      lead_type: 'customer',
      source: 'website',
      status: 'new',
      notes: null,
    });
  }
  return leads;
}

function parseCorporateDatabase() {
  const wb = XLSX.readFile(path.join(BASE_DIR, 'Corporate Database.xlsx'));
  const data = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });
  const leads = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || (!row[0] && !row[4])) continue;

    const firstName = cleanName(row[0]);
    const lastName = cleanName(row[1]);
    const company = cleanName(row[2]);
    const phone = row[3] ? String(row[3]).trim() : null;
    const email = normalizeEmail(row[4]);

    const name = [firstName, lastName].filter(Boolean).join(' ');
    if (!name && !email) continue;

    leads.push({
      name: name || company || 'Unknown',
      email,
      phone,
      company,
      lead_type: 'corporate',
      source: 'website',
      status: 'new',
      notes: null,
    });
  }
  return leads;
}

function parseCustomerDatabase() {
  const wb = XLSX.readFile(path.join(BASE_DIR, 'Customer Database.xlsx'));
  const leads = [];

  // Sheet: COOKING CLASS (headers on row 2: NAME, EMAIL, CONFIRMED)
  const cookingData = XLSX.utils.sheet_to_json(wb.Sheets['COOKING CLASS'], { header: 1 });
  for (let i = 3; i < cookingData.length; i++) {
    const row = cookingData[i];
    if (!row || !row[0]) continue;

    const name = cleanName(row[0]);
    const email = normalizeEmail(row[2]);
    if (!name) continue;

    leads.push({
      name,
      email,
      phone: null,
      company: null,
      lead_type: 'cooking_class',
      source: 'website',
      status: 'new',
      notes: null,
    });
  }

  // Sheet: Sheet1 (just names - TOTAL header)
  const sheet1Data = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });
  for (let i = 1; i < sheet1Data.length; i++) {
    const row = sheet1Data[i];
    if (!row || !row[0]) continue;

    const name = cleanName(row[0]);
    if (!name || name === 'TOTAL') continue;

    leads.push({
      name,
      email: null,
      phone: null,
      company: null,
      lead_type: 'customer',
      source: 'website',
      status: 'new',
      notes: null,
    });
  }

  // Sheet: corporate (Name, Company, Email, contact)
  const corpData = XLSX.utils.sheet_to_json(wb.Sheets['corporate'], { header: 1 });
  for (let i = 1; i < corpData.length; i++) {
    const row = corpData[i];
    if (!row || (!row[0] && !row[3])) continue;

    const name = cleanName(row[0]);
    const company = cleanName(row[2]);
    const email = normalizeEmail(row[3]);
    const phone = row[5] ? String(row[5]).trim() : null;

    if (!name && !email) continue;

    leads.push({
      name: name || company || 'Unknown',
      email,
      phone,
      company,
      lead_type: 'corporate',
      source: 'website',
      status: 'new',
      notes: null,
    });
  }

  return leads;
}

// ========== DEDUPLICATION ==========

function deduplicateLocally(leads) {
  const seen = new Map(); // key -> lead
  const unique = [];

  for (const lead of leads) {
    // Generate dedup keys based on available data
    const keys = [];

    const normPhone = normalizePhone(lead.phone);
    const normEmail = lead.email?.toLowerCase();

    if (normPhone) keys.push(`phone:${normPhone}`);
    if (normEmail) keys.push(`email:${normEmail}`);
    // If no phone or email, use name as key (less reliable but prevents exact name dupes)
    if (keys.length === 0 && lead.name) {
      keys.push(`name:${lead.name.toLowerCase()}`);
    }

    let isDupe = false;
    for (const key of keys) {
      if (seen.has(key)) {
        isDupe = true;
        // Merge data: fill in missing fields from the duplicate
        const existing = seen.get(key);
        if (!existing.email && lead.email) existing.email = lead.email;
        if (!existing.phone && lead.phone) existing.phone = lead.phone;
        if (!existing.company && lead.company) existing.company = lead.company;
        if (!existing.notes && lead.notes) existing.notes = lead.notes;
        if (existing.lead_type === 'customer' && lead.lead_type !== 'customer') {
          existing.lead_type = lead.lead_type;
        }
        break;
      }
    }

    if (!isDupe) {
      for (const key of keys) {
        seen.set(key, lead);
      }
      unique.push(lead);
    }
  }

  return unique;
}

// ========== MAIN ==========

async function main() {
  console.log('📂 Reading Excel files...\n');

  // Parse all files
  const schoolLeads = parseSchoolDatabase();
  console.log(`📚 School Database: ${schoolLeads.length} contacts`);

  const crmLeads = parseDatabaseForCRM();
  console.log(`📋 CRM Database: ${crmLeads.length} contacts`);

  const corpLeads = parseCorporateDatabase();
  console.log(`🏢 Corporate Database: ${corpLeads.length} contacts`);

  const custLeads = parseCustomerDatabase();
  console.log(`👤 Customer Database: ${custLeads.length} contacts`);

  const allNewLeads = [...schoolLeads, ...crmLeads, ...corpLeads, ...custLeads];
  console.log(`\n📊 Total parsed: ${allNewLeads.length} contacts`);

  // Local deduplication
  const dedupedNew = deduplicateLocally(allNewLeads);
  console.log(`🔄 After local dedup: ${dedupedNew.length} unique contacts`);

  // Fetch existing leads from DB for dedup
  console.log('\n📡 Fetching existing leads from database...');
  let existingLeads = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error('Error fetching leads:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    existingLeads = existingLeads.concat(data);
    offset += pageSize;
    if (data.length < pageSize) break;
  }
  console.log(`📌 Existing leads in DB: ${existingLeads.length}`);

  // Build index of existing leads
  const existingPhones = new Set();
  const existingEmails = new Set();
  const existingNames = new Set();

  for (const lead of existingLeads) {
    if (lead.phone) existingPhones.add(normalizePhone(lead.phone));
    if (lead.email) existingEmails.add(lead.email.toLowerCase());
    if (lead.name) existingNames.add(lead.name.toLowerCase());
  }

  // Filter out leads that already exist in DB
  const toInsert = dedupedNew.filter(lead => {
    const normPhone = normalizePhone(lead.phone);
    const normEmail = lead.email?.toLowerCase();

    // Check phone match
    if (normPhone && existingPhones.has(normPhone)) return false;
    // Check email match
    if (normEmail && existingEmails.has(normEmail)) return false;
    // If no phone or email, check name match
    if (!normPhone && !normEmail && lead.name) {
      if (existingNames.has(lead.name.toLowerCase())) return false;
    }

    return true;
  });

  const skipped = dedupedNew.length - toInsert.length;
  console.log(`⏭️  Skipping ${skipped} duplicates (already in DB)`);
  console.log(`✅ New leads to insert: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('\n🎉 No new leads to insert. All contacts already exist.');
    return;
  }

  // Insert in batches of 100
  console.log('\n📤 Inserting leads...');
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('leads')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/batchSize)+1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      process.stdout.write(`  ✓ Inserted ${inserted}/${toInsert.length}\r`);
    }
  }

  console.log(`\n\n========== IMPORT SUMMARY ==========`);
  console.log(`📂 Files processed: 4`);
  console.log(`📊 Total contacts parsed: ${allNewLeads.length}`);
  console.log(`🔄 After dedup: ${dedupedNew.length}`);
  console.log(`⏭️  Duplicates skipped: ${skipped}`);
  console.log(`✅ Successfully inserted: ${inserted}`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  console.log(`📌 Total leads in DB now: ${existingLeads.length + inserted}`);
  console.log(`====================================\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
