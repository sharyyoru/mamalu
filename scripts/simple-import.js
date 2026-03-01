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

async function getExistingEmails() {
  console.log("Fetching existing contacts from database...");
  const allEmails = new Set();
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from("newsletter_leads")
      .select("email")
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching existing emails:", error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    data.forEach(r => allEmails.add(r.email?.toLowerCase()));
    offset += limit;
    
    if (data.length < limit) break;
  }
  
  console.log(`Found ${allEmails.size} existing contacts in database`);
  return allEmails;
}

async function importContacts() {
  console.log("=".repeat(60));
  console.log("CONTACT IMPORT");
  console.log("=".repeat(60));
  
  const existingEmails = await getExistingEmails();
  const contactsDir = path.join(process.cwd(), "public", "newcontacts");
  
  // Collect all unique emails from all files
  const allContacts = new Map(); // email -> source
  let totalRecords = 0;
  
  // Process contacts-2.csv (Wix)
  const wixFile = path.join(contactsDir, "contacts-2.csv");
  if (fs.existsSync(wixFile)) {
    console.log("\nReading contacts-2.csv (Wix)...");
    const content = fs.readFileSync(wixFile, "utf-8");
    const records = parseCSV(content);
    console.log(`  Found ${records.length} records`);
    totalRecords += records.length;
    
    for (const r of records) {
      const email = cleanEmail(r["Email 1"]);
      if (email && !allContacts.has(email)) {
        allContacts.set(email, "wix");
      }
    }
  }
  
  // Process Mailchimp subscribed
  const subscribedFile = path.join(contactsDir, "subscribed_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(subscribedFile)) {
    console.log("\nReading subscribed_email_audience_export...");
    const content = fs.readFileSync(subscribedFile, "utf-8");
    const records = parseCSV(content);
    console.log(`  Found ${records.length} records`);
    totalRecords += records.length;
    
    for (const r of records) {
      const email = cleanEmail(r["Email Address"]);
      if (email && !allContacts.has(email)) {
        allContacts.set(email, "mailchimp_subscribed");
      }
    }
  }
  
  // Process Mailchimp unsubscribed
  const unsubscribedFile = path.join(contactsDir, "unsubscribed_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(unsubscribedFile)) {
    console.log("\nReading unsubscribed_email_audience_export...");
    const content = fs.readFileSync(unsubscribedFile, "utf-8");
    const records = parseCSV(content);
    console.log(`  Found ${records.length} records`);
    totalRecords += records.length;
    
    for (const r of records) {
      const email = cleanEmail(r["Email Address"]);
      if (email && !allContacts.has(email)) {
        allContacts.set(email, "mailchimp_unsubscribed");
      }
    }
  }
  
  // Process Mailchimp cleaned
  const cleanedFile = path.join(contactsDir, "cleaned_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(cleanedFile)) {
    console.log("\nReading cleaned_email_audience_export...");
    const content = fs.readFileSync(cleanedFile, "utf-8");
    const records = parseCSV(content);
    console.log(`  Found ${records.length} records`);
    totalRecords += records.length;
    
    for (const r of records) {
      const email = cleanEmail(r["Email Address"]);
      if (email && !allContacts.has(email)) {
        allContacts.set(email, "mailchimp_cleaned");
      }
    }
  }
  
  // Process Mailchimp nonsubscribed
  const nonsubscribedFile = path.join(contactsDir, "nonsubscribed_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(nonsubscribedFile)) {
    console.log("\nReading nonsubscribed_email_audience_export...");
    const content = fs.readFileSync(nonsubscribedFile, "utf-8");
    const records = parseCSV(content);
    console.log(`  Found ${records.length} records`);
    totalRecords += records.length;
    
    for (const r of records) {
      const email = cleanEmail(r["Email Address"]);
      if (email && !allContacts.has(email)) {
        allContacts.set(email, "mailchimp_nonsubscribed");
      }
    }
  }
  
  console.log(`\nTotal records in files: ${totalRecords}`);
  console.log(`Unique emails found: ${allContacts.size}`);
  
  // Filter out existing emails
  const newContacts = [];
  let duplicateCount = 0;
  
  for (const [email, source] of allContacts) {
    if (existingEmails.has(email)) {
      duplicateCount++;
    } else {
      newContacts.push({ email, source });
    }
  }
  
  console.log(`\nDuplicates (already in database): ${duplicateCount}`);
  console.log(`New contacts to insert: ${newContacts.length}`);
  
  // Insert new contacts in batches
  if (newContacts.length > 0) {
    console.log("\nInserting new contacts...");
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;
    
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
        // Try one by one to handle individual duplicates
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
            }
          } else {
            inserted++;
          }
        }
      } else {
        inserted += batch.length;
      }
      
      // Progress
      if ((i + batchSize) % 500 === 0 || i + batchSize >= newContacts.length) {
        console.log(`  Progress: ${Math.min(i + batchSize, newContacts.length)}/${newContacts.length}`);
      }
    }
    
    console.log(`\n  Inserted: ${inserted}`);
    console.log(`  Errors: ${errors}`);
  }
  
  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total records in CSV files: ${totalRecords}`);
  console.log(`Unique emails in files: ${allContacts.size}`);
  console.log(`Duplicates within files: ${totalRecords - allContacts.size}`);
  console.log(`Already in database (duplicates): ${duplicateCount}`);
  console.log(`New contacts uploaded: ${newContacts.length - duplicateCount}`);
  console.log("=".repeat(60));
}

importContacts().catch(console.error);
