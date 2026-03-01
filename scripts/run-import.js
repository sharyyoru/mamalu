const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cleanEmail(email) {
  if (!email) return null;
  const cleaned = email.toLowerCase().trim();
  if (!cleaned.includes("@")) return null;
  return cleaned;
}

function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.length < 7) return null;
  return cleaned;
}

function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr
    .replace(/^"|"$/g, "")
    .split('","')
    .map((t) => t.replace(/"/g, "").trim())
    .filter((t) => t.length > 0);
}

function parseCSV(content) {
  const lines = content.split("\n");
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || "";
    });
    records.push(record);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function runMigration() {
  console.log("Running migration to add columns...");
  
  // Check if columns exist by trying to select them
  const { error: checkError } = await supabase
    .from("newsletter_leads")
    .select("first_name")
    .limit(1);
  
  if (checkError && checkError.message.includes("does not exist")) {
    console.log("Columns don't exist, need to add them via Supabase dashboard");
    console.log("Please run this SQL in your Supabase dashboard:");
    console.log(`
ALTER TABLE newsletter_leads 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'subscribed',
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS original_source TEXT,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;
    `);
    return false;
  }
  
  console.log("Columns exist, proceeding with import...");
  return true;
}

async function importFile(filePath, parser, statusOverride) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  File not found: ${filePath}`);
    return { total: 0, inserted: 0, updated: 0, errors: 0 };
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parseCSV(content);
  console.log(`  Found ${records.length} records`);
  
  let inserted = 0, updated = 0, errors = 0;
  
  for (const record of records) {
    const contact = parser(record, fileName, statusOverride);
    if (!contact) continue;
    
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from("newsletter_leads")
        .select("id, status, tags")
        .eq("email", contact.email)
        .single();
      
      if (existing) {
        // Update
        const existingTags = existing.tags || [];
        const mergedTags = [...new Set([...existingTags, ...(contact.tags || [])])];
        
        const updateData = {
          import_source: contact.import_source,
          imported_at: new Date().toISOString(),
        };
        if (contact.first_name) updateData.first_name = contact.first_name;
        if (contact.last_name) updateData.last_name = contact.last_name;
        if (contact.phone) updateData.phone = contact.phone;
        if (mergedTags.length > 0) updateData.tags = mergedTags;
        
        const { error } = await supabase
          .from("newsletter_leads")
          .update(updateData)
          .eq("id", existing.id);
        
        if (error) errors++;
        else updated++;
      } else {
        // Insert
        const { error } = await supabase.from("newsletter_leads").insert({
          email: contact.email,
          first_name: contact.first_name || null,
          last_name: contact.last_name || null,
          phone: contact.phone || null,
          tags: contact.tags && contact.tags.length > 0 ? contact.tags : null,
          status: contact.status,
          source: "import",
          import_source: contact.import_source,
          original_source: contact.original_source || null,
          subscribed_at: contact.status === "subscribed" ? new Date().toISOString() : null,
          imported_at: new Date().toISOString(),
        });
        
        if (error) errors++;
        else inserted++;
      }
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`  Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`);
  return { total: records.length, inserted, updated, errors };
}

function parseWixRecord(record, fileName) {
  const email = cleanEmail(record["Email 1"]);
  if (!email) return null;
  
  const statusRaw = (record["Email subscriber status"] || "").toLowerCase();
  let status = "subscribed";
  if (statusRaw === "never subscribed") status = "nonsubscribed";
  else if (statusRaw === "unsubscribed") status = "unsubscribed";
  
  const labels = record["Labels"] ? record["Labels"].split(";").map(l => l.trim()).filter(l => l) : [];
  
  return {
    email,
    first_name: record["First Name"]?.trim() || null,
    last_name: record["Last Name"]?.trim() || null,
    phone: cleanPhone(record["Phone 1"]),
    tags: labels,
    status,
    import_source: fileName,
    original_source: record["Source"]?.trim() || "Wix",
  };
}

function parseMailchimpRecord(record, fileName, status) {
  const email = cleanEmail(record["Email Address"]);
  if (!email) return null;
  
  return {
    email,
    first_name: record["First Name"]?.trim() || null,
    last_name: record["Last Name"]?.trim() || null,
    phone: cleanPhone(record["Phone Number"]),
    tags: parseTags(record["TAGS"]),
    status,
    import_source: fileName,
    original_source: "Mailchimp",
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("CONTACT IMPORT SCRIPT");
  console.log("=".repeat(60));
  
  const migrationOk = await runMigration();
  if (!migrationOk) {
    process.exit(1);
  }
  
  const contactsDir = path.join(process.cwd(), "public", "newcontacts");
  const results = [];
  
  // Process all files
  results.push(await importFile(
    path.join(contactsDir, "contacts-2.csv"),
    parseWixRecord
  ));
  
  results.push(await importFile(
    path.join(contactsDir, "subscribed_email_audience_export_b3eca53876.csv"),
    parseMailchimpRecord,
    "subscribed"
  ));
  
  results.push(await importFile(
    path.join(contactsDir, "unsubscribed_email_audience_export_b3eca53876.csv"),
    parseMailchimpRecord,
    "unsubscribed"
  ));
  
  results.push(await importFile(
    path.join(contactsDir, "cleaned_email_audience_export_b3eca53876.csv"),
    parseMailchimpRecord,
    "cleaned"
  ));
  
  results.push(await importFile(
    path.join(contactsDir, "nonsubscribed_email_audience_export_b3eca53876.csv"),
    parseMailchimpRecord,
    "nonsubscribed"
  ));
  
  // Summary
  const totals = results.reduce((acc, r) => ({
    total: acc.total + r.total,
    inserted: acc.inserted + r.inserted,
    updated: acc.updated + r.updated,
    errors: acc.errors + r.errors,
  }), { total: 0, inserted: 0, updated: 0, errors: 0 });
  
  console.log("\n" + "=".repeat(60));
  console.log("IMPORT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total records processed: ${totals.total}`);
  console.log(`NEW contacts inserted: ${totals.inserted}`);
  console.log(`DUPLICATE contacts updated: ${totals.updated}`);
  console.log(`Errors: ${totals.errors}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
