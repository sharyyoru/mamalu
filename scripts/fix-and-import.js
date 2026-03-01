const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Use service role key which bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Service Key exists:", !!supabaseKey);
console.log("Service Key prefix:", supabaseKey?.substring(0, 20) + "...");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
      record[h.trim()] = values[idx] || "";
    });
    records.push(record);
  }
  return records;
}

async function testConnection() {
  console.log("\nTesting database connection...");
  
  // Try to query the table
  const { data, error, count } = await supabase
    .from("newsletter_leads")
    .select("*", { count: "exact" })
    .limit(1);
  
  if (error) {
    console.log("Error:", error.message);
    console.log("Error code:", error.code);
    return false;
  }
  
  console.log("Connection successful! Current count:", count);
  return true;
}

async function importContacts() {
  console.log("=".repeat(60));
  console.log("CONTACT IMPORT WITH FIXED CONNECTION");
  console.log("=".repeat(60));
  
  const connected = await testConnection();
  if (!connected) {
    console.log("\nCannot connect to database. Please check:");
    console.log("1. The newsletter_leads table exists");
    console.log("2. RLS policies allow service role access");
    console.log("3. The SUPABASE_SERVICE_ROLE_KEY is correct");
    return;
  }
  
  // Get existing emails
  console.log("\nFetching existing contacts...");
  const existingEmails = new Set();
  
  const { data: existing, error: fetchError } = await supabase
    .from("newsletter_leads")
    .select("email");
  
  if (fetchError) {
    console.log("Error fetching existing:", fetchError.message);
  } else if (existing) {
    existing.forEach(r => existingEmails.add(r.email?.toLowerCase()));
    console.log(`Found ${existingEmails.size} existing contacts`);
  }
  
  const contactsDir = path.join(process.cwd(), "public", "newcontacts");
  
  // Collect all unique emails
  const allContacts = new Map();
  let totalRecords = 0;
  
  // Process all CSV files
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
  
  console.log(`\nTotal records in files: ${totalRecords}`);
  console.log(`Unique emails: ${allContacts.size}`);
  
  // Filter out existing
  const newContacts = [];
  let duplicateCount = 0;
  
  for (const [email, source] of allContacts) {
    if (existingEmails.has(email)) {
      duplicateCount++;
    } else {
      newContacts.push({ email, source });
    }
  }
  
  console.log(`\nAlready in database: ${duplicateCount}`);
  console.log(`New to insert: ${newContacts.length}`);
  
  // Insert in batches
  if (newContacts.length > 0) {
    console.log("\nInserting new contacts...");
    let inserted = 0;
    let errors = 0;
    const batchSize = 50;
    
    for (let i = 0; i < newContacts.length; i += batchSize) {
      const batch = newContacts.slice(i, i + batchSize);
      const insertData = batch.map(c => ({
        email: c.email,
        source: "import",
        subscribed_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase
        .from("newsletter_leads")
        .insert(insertData);
      
      if (error) {
        // Try one by one
        for (const c of batch) {
          const { error: singleError } = await supabase
            .from("newsletter_leads")
            .insert({
              email: c.email,
              source: "import",
              subscribed_at: new Date().toISOString(),
            });
          
          if (singleError) {
            if (singleError.message.includes("duplicate")) {
              duplicateCount++;
            } else {
              errors++;
              if (errors <= 5) console.log("  Error:", singleError.message);
            }
          } else {
            inserted++;
          }
        }
      } else {
        inserted += batch.length;
      }
      
      if ((i + batchSize) % 500 === 0 || i + batchSize >= newContacts.length) {
        console.log(`  Progress: ${Math.min(i + batchSize, newContacts.length)}/${newContacts.length} (inserted: ${inserted})`);
      }
    }
    
    console.log(`\n  Total inserted: ${inserted}`);
    console.log(`  Total errors: ${errors}`);
  }
  
  // Final count
  const { count: finalCount } = await supabase
    .from("newsletter_leads")
    .select("*", { count: "exact", head: true });
  
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total records in CSV files: ${totalRecords}`);
  console.log(`Unique emails in files: ${allContacts.size}`);
  console.log(`Duplicates within files: ${totalRecords - allContacts.size}`);
  console.log(`Already in database: ${duplicateCount}`);
  console.log(`New contacts added: ${newContacts.length - duplicateCount}`);
  console.log(`Total contacts in database now: ${finalCount}`);
  console.log("=".repeat(60));
}

importContacts().catch(console.error);
