require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE_DIR = path.join(__dirname, '..', 'public', 'updates');

// Normalize phone for dedup
function normalizePhone(phone) {
  if (!phone || phone === 'NULL') return null;
  let p = String(phone).replace(/[^0-9+]/g, '');
  if (!p || p.length < 5) return null;
  // Remove leading + for comparison
  if (p.startsWith('+')) p = p.substring(1);
  // Remove leading 971 prefix for normalization
  if (p.startsWith('971') && p.length > 9) p = p.substring(3);
  // Remove leading 0
  if (p.startsWith('0') && p.length > 5) p = p.substring(1);
  return p || null;
}

// Normalize email for dedup
function normalizeEmail(email) {
  if (!email || email === 'NULL') return null;
  const e = String(email).trim().toLowerCase();
  return e.includes('@') ? e : null;
}

// Clean name
function cleanName(name) {
  if (!name || name === 'NULL' || name === '""') return null;
  let n = String(name).trim().replace(/^"+|"+$/g, '').trim();
  if (!n || n.length < 2) return null;
  return n.replace(/\s+/g, ' ');
}

// Determine lead_type from Wix labels
function labelToLeadType(labels) {
  if (!labels) return 'individual';
  const l = labels.toLowerCase();
  if (l.includes('customer')) return 'customer';
  if (l.includes('mini chef') || l.includes('mummy') || l.includes('baking') || 
      l.includes('sushi') || l.includes('pizza') || l.includes('chef') ||
      l.includes('sourdough') || l.includes('bread') || l.includes('tart') ||
      l.includes('cooking') || l.includes('tapas') || l.includes('greek') ||
      l.includes('spanish') || l.includes('pie') || l.includes('cupcake') ||
      l.includes('halloween') || l.includes('fathers day')) return 'cooking_class';
  return 'individual';
}

// ========== PARSERS ==========

function parseRegistration() {
  const raw = fs.readFileSync(path.join(BASE_DIR, 'registration_tbl (1) (1).csv'), 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const leads = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const name = cleanName(cols[1]);
    const email = normalizeEmail(cols[2]);
    const phone = cols[3] && cols[3] !== 'NULL' ? cols[3].trim() : null;
    const mobile1 = cols[4] && cols[4] !== 'NULL' ? cols[4].trim() : null;
    const mobile2 = cols[5] && cols[5] !== 'NULL' ? cols[5].trim() : null;

    // Use mobile1 as primary phone, fallback to phone or mobile2
    const primaryPhone = mobile1 || phone || mobile2;

    // Skip rows with no useful data
    if (!name && !email && !primaryPhone) continue;

    leads.push({
      name: name || 'Unknown',
      email,
      phone: primaryPhone,
      company: null,
      lead_type: 'individual',
      source: 'website',
      status: 'new',
      notes: null,
    });
  }
  return leads;
}

function parseContacts() {
  const raw = fs.readFileSync(path.join(BASE_DIR, 'contacts (1).csv'), 'utf8');
  const result = Papa.parse(raw, { header: true, skipEmptyLines: true });
  const leads = [];

  for (const row of result.data) {
    const firstName = cleanName(row['First Name']);
    const lastName = cleanName(row['Last Name']);
    const email1 = normalizeEmail(row['Email 1']);
    const email2 = normalizeEmail(row['Email 2']);
    const phone1 = row['Phone 1'] ? String(row['Phone 1']).replace(/'/g, '').trim() : null;
    const phone2 = row['Phone 2'] ? String(row['Phone 2']).replace(/'/g, '').trim() : null;
    const company = cleanName(row['Company']);
    const labels = (row['Labels'] || '').trim();

    const name = [firstName, lastName].filter(Boolean).join(' ');
    const email = email1 || email2;
    const phone = phone1 || phone2;

    // Skip rows with no useful data
    if (!name && !email && !phone) continue;

    const leadType = labelToLeadType(labels);

    leads.push({
      name: name || 'Unknown',
      email,
      phone,
      company: company || null,
      lead_type: leadType,
      source: 'website',
      status: 'new',
      notes: labels ? `Labels: ${labels}` : null,
    });
  }
  return leads;
}

// ========== DEDUPLICATION ==========

function deduplicateLocally(leads) {
  const seen = new Map();
  const unique = [];

  for (const lead of leads) {
    const normPhone = normalizePhone(lead.phone);
    const normEmail = lead.email?.toLowerCase();
    const keys = [];

    if (normEmail) keys.push(`email:${normEmail}`);
    if (normPhone) keys.push(`phone:${normPhone}`);
    if (keys.length === 0 && lead.name && lead.name !== 'Unknown') {
      keys.push(`name:${lead.name.toLowerCase()}`);
    }

    let isDupe = false;
    for (const key of keys) {
      if (seen.has(key)) {
        isDupe = true;
        // Merge missing data from duplicate
        const existing = seen.get(key);
        if (!existing.email && lead.email) existing.email = lead.email;
        if (!existing.phone && lead.phone) existing.phone = lead.phone;
        if (!existing.company && lead.company) existing.company = lead.company;
        if (existing.name === 'Unknown' && lead.name !== 'Unknown') existing.name = lead.name;
        break;
      }
    }

    if (!isDupe) {
      for (const key of keys) seen.set(key, lead);
      unique.push(lead);
    }
  }
  return unique;
}

// ========== MAIN ==========

async function main() {
  console.log('📂 Reading CSV files...\n');

  const regLeads = parseRegistration();
  console.log(`📋 Registration: ${regLeads.length} contacts`);

  const contactLeads = parseContacts();
  console.log(`👤 Contacts: ${contactLeads.length} contacts`);

  const allNewLeads = [...regLeads, ...contactLeads];
  console.log(`\n📊 Total parsed: ${allNewLeads.length} contacts`);

  // Local dedup
  const dedupedNew = deduplicateLocally(allNewLeads);
  console.log(`🔄 After local dedup: ${dedupedNew.length} unique contacts`);

  // Fetch ALL existing leads from DB
  console.log('\n📡 Fetching existing leads from database...');
  let existingLeads = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .range(offset, offset + pageSize - 1);
    if (error) { console.error('Error fetching leads:', error.message); break; }
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
    const np = normalizePhone(lead.phone);
    if (np) existingPhones.add(np);
    if (lead.email) existingEmails.add(lead.email.toLowerCase());
    if (lead.name) existingNames.add(lead.name.toLowerCase());
  }

  // Filter out existing
  const toInsert = dedupedNew.filter(lead => {
    const normPhone = normalizePhone(lead.phone);
    const normEmail = lead.email?.toLowerCase();

    if (normPhone && existingPhones.has(normPhone)) return false;
    if (normEmail && existingEmails.has(normEmail)) return false;
    if (!normPhone && !normEmail && lead.name && lead.name !== 'Unknown') {
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

  // Insert in batches
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
  console.log(`📂 Files processed: 2`);
  console.log(`📊 Total contacts parsed: ${allNewLeads.length}`);
  console.log(`🔄 After dedup: ${dedupedNew.length}`);
  console.log(`⏭️  Duplicates skipped (in DB): ${skipped}`);
  console.log(`✅ Successfully inserted: ${inserted}`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  console.log(`📌 Total leads in DB now: ${existingLeads.length + inserted}`);
  console.log(`====================================\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
