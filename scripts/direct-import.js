const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanEmail(email) {
  if (!email) return null;
  const cleaned = String(email).toLowerCase().trim();
  if (!cleaned.includes("@")) return null;
  return cleaned;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += char;
  }
  result.push(current.trim());
  return result;
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
    headers.forEach((h, idx) => { record[h.trim()] = values[idx] || ""; });
    records.push(record);
  }
  return records;
}

async function supabaseRequest(endpoint, method = "GET", body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": method === "POST" ? "return=minimal" : "return=representation"
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }
  
  if (method === "GET") {
    return response.json();
  }
  return { success: true };
}

async function getExistingEmails() {
  try {
    const data = await supabaseRequest("newsletter_leads?select=email");
    return new Set(data.map(r => r.email?.toLowerCase()));
  } catch (e) {
    console.log("Error fetching existing:", e.message);
    return new Set();
  }
}

async function insertContact(email) {
  try {
    await supabaseRequest("newsletter_leads", "POST", {
      email,
      source: "import",
      subscribed_at: new Date().toISOString()
    });
    return { success: true };
  } catch (e) {
    if (e.message.includes("duplicate") || e.message.includes("23505")) {
      return { duplicate: true };
    }
    return { error: e.message };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("DIRECT REST API IMPORT");
  console.log("=".repeat(60));
  
  // Test connection
  console.log("\nTesting connection...");
  try {
    const test = await supabaseRequest("newsletter_leads?select=id&limit=1");
    console.log("Connection successful!");
  } catch (e) {
    console.log("Connection error:", e.message);
    console.log("\nPlease ensure the newsletter_leads table exists with proper RLS policies.");
    console.log("Run this SQL in Supabase Dashboard:\n");
    console.log(`
-- Create table if not exists
CREATE TABLE IF NOT EXISTS newsletter_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON newsletter_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon to insert (for website signups)
CREATE POLICY "Anon can insert" ON newsletter_leads
  FOR INSERT TO anon WITH CHECK (true);
    `);
    return;
  }
  
  // Get existing
  console.log("\nFetching existing contacts...");
  const existingEmails = await getExistingEmails();
  console.log(`Found ${existingEmails.size} existing contacts`);
  
  // Read all files
  const contactsDir = path.join(process.cwd(), "public", "newcontacts");
  const allContacts = new Map();
  let totalRecords = 0;
  
  const files = [
    { path: "contacts-2.csv", emailCol: "Email 1" },
    { path: "subscribed_email_audience_export_b3eca53876.csv", emailCol: "Email Address" },
    { path: "unsubscribed_email_audience_export_b3eca53876.csv", emailCol: "Email Address" },
    { path: "cleaned_email_audience_export_b3eca53876.csv", emailCol: "Email Address" },
    { path: "nonsubscribed_email_audience_export_b3eca53876.csv", emailCol: "Email Address" },
  ];
  
  for (const file of files) {
    const filePath = path.join(contactsDir, file.path);
    if (!fs.existsSync(filePath)) continue;
    
    console.log(`\nReading ${file.path}...`);
    const content = fs.readFileSync(filePath, "utf-8");
    const records = parseCSV(content);
    console.log(`  Found ${records.length} records`);
    totalRecords += records.length;
    
    for (const r of records) {
      const email = cleanEmail(r[file.emailCol]);
      if (email && !allContacts.has(email)) {
        allContacts.set(email, file.path);
      }
    }
  }
  
  console.log(`\nTotal records: ${totalRecords}`);
  console.log(`Unique emails: ${allContacts.size}`);
  
  // Filter
  const newContacts = [];
  let alreadyExists = 0;
  for (const [email] of allContacts) {
    if (existingEmails.has(email)) alreadyExists++;
    else newContacts.push(email);
  }
  
  console.log(`Already in DB: ${alreadyExists}`);
  console.log(`New to insert: ${newContacts.length}`);
  
  // Insert
  if (newContacts.length > 0) {
    console.log("\nInserting contacts...");
    let inserted = 0, duplicates = 0, errors = 0;
    
    for (let i = 0; i < newContacts.length; i++) {
      const result = await insertContact(newContacts[i]);
      if (result.success) inserted++;
      else if (result.duplicate) duplicates++;
      else errors++;
      
      if ((i + 1) % 100 === 0 || i === newContacts.length - 1) {
        console.log(`  Progress: ${i + 1}/${newContacts.length} (inserted: ${inserted}, dupes: ${duplicates}, errors: ${errors})`);
      }
    }
    
    console.log(`\nInserted: ${inserted}`);
    console.log(`Duplicates found during insert: ${duplicates}`);
    console.log(`Errors: ${errors}`);
  }
  
  // Final count
  const final = await supabaseRequest("newsletter_leads?select=id");
  
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total records in CSV files: ${totalRecords}`);
  console.log(`Unique emails in files: ${allContacts.size}`);
  console.log(`Duplicates within files: ${totalRecords - allContacts.size}`);
  console.log(`Already in database: ${alreadyExists}`);
  console.log(`Total contacts in database: ${final.length}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
