import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Contact {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tags?: string[];
  status: "subscribed" | "unsubscribed" | "cleaned" | "nonsubscribed";
  source: string;
  import_source: string;
  original_source?: string;
}

interface ImportResult {
  file: string;
  total: number;
  inserted: number;
  updated: number;
  duplicates: number;
  errors: number;
}

// Clean and normalize email
function cleanEmail(email: string | undefined): string | null {
  if (!email) return null;
  const cleaned = email.toLowerCase().trim();
  if (!cleaned.includes("@")) return null;
  return cleaned;
}

// Clean phone number
function cleanPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  // Remove non-numeric chars except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.length < 7) return null;
  return cleaned;
}

// Parse tags from Mailchimp format
function parseTags(tagsStr: string | undefined): string[] {
  if (!tagsStr) return [];
  // Mailchimp exports tags as """Tag1"",""Tag2"""
  return tagsStr
    .replace(/^"|"$/g, "")
    .split('","')
    .map((t) => t.replace(/"/g, "").trim())
    .filter((t) => t.length > 0);
}

// Parse contacts-2.csv (Wix format)
function parseWixContacts(filePath: string): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  for (const record of records) {
    const email = cleanEmail(record["Email 1"]);
    if (!email) continue;
    
    const status = record["Email subscriber status"]?.toLowerCase();
    let contactStatus: Contact["status"] = "subscribed";
    if (status === "never subscribed") contactStatus = "nonsubscribed";
    else if (status === "unsubscribed") contactStatus = "unsubscribed";
    
    // Parse labels as tags
    const labels = record["Labels"] ? record["Labels"].split(";").map((l: string) => l.trim()).filter((l: string) => l) : [];
    
    contacts.push({
      email,
      first_name: record["First Name"]?.trim() || undefined,
      last_name: record["Last Name"]?.trim() || undefined,
      phone: cleanPhone(record["Phone 1"]) || undefined,
      tags: labels,
      status: contactStatus,
      source: "import",
      import_source: "contacts-2.csv",
      original_source: record["Source"]?.trim() || "Wix",
    });
  }
  
  return contacts;
}

// Parse Mailchimp subscribed export
function parseMailchimpSubscribed(filePath: string): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  for (const record of records) {
    const email = cleanEmail(record["Email Address"]);
    if (!email) continue;
    
    contacts.push({
      email,
      first_name: record["First Name"]?.trim() || undefined,
      last_name: record["Last Name"]?.trim() || undefined,
      phone: cleanPhone(record["Phone Number"]) || undefined,
      tags: parseTags(record["TAGS"]),
      status: "subscribed",
      source: "import",
      import_source: path.basename(filePath),
      original_source: "Mailchimp",
    });
  }
  
  return contacts;
}

// Parse Mailchimp unsubscribed export
function parseMailchimpUnsubscribed(filePath: string): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  for (const record of records) {
    const email = cleanEmail(record["Email Address"]);
    if (!email) continue;
    
    contacts.push({
      email,
      first_name: record["First Name"]?.trim() || undefined,
      last_name: record["Last Name"]?.trim() || undefined,
      phone: cleanPhone(record["Phone Number"]) || undefined,
      tags: parseTags(record["TAGS"]),
      status: "unsubscribed",
      source: "import",
      import_source: path.basename(filePath),
      original_source: "Mailchimp",
    });
  }
  
  return contacts;
}

// Parse Mailchimp cleaned export
function parseMailchimpCleaned(filePath: string): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  for (const record of records) {
    const email = cleanEmail(record["Email Address"]);
    if (!email) continue;
    
    contacts.push({
      email,
      first_name: record["First Name"]?.trim() || undefined,
      last_name: record["Last Name"]?.trim() || undefined,
      phone: cleanPhone(record["Phone Number"]) || undefined,
      tags: parseTags(record["TAGS"]),
      status: "cleaned",
      source: "import",
      import_source: path.basename(filePath),
      original_source: "Mailchimp",
    });
  }
  
  return contacts;
}

// Parse Mailchimp non-subscribed export
function parseMailchimpNonsubscribed(filePath: string): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  for (const record of records) {
    const email = cleanEmail(record["Email Address"]);
    if (!email) continue;
    
    contacts.push({
      email,
      first_name: record["First Name"]?.trim() || undefined,
      last_name: record["Last Name"]?.trim() || undefined,
      phone: cleanPhone(record["Phone Number"]) || undefined,
      tags: parseTags(record["TAGS"]),
      status: "nonsubscribed",
      source: "import",
      import_source: path.basename(filePath),
      original_source: "Mailchimp",
    });
  }
  
  return contacts;
}

// Upsert contacts to database
async function upsertContacts(contacts: Contact[]): Promise<{ inserted: number; updated: number; errors: number }> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const contact of contacts) {
    try {
      // Check if contact exists
      const { data: existing } = await supabase
        .from("newsletter_leads")
        .select("id, status, tags")
        .eq("email", contact.email)
        .single();
      
      if (existing) {
        // Update existing - merge tags, keep better status
        const existingTags = existing.tags || [];
        const mergedTags = [...new Set([...existingTags, ...(contact.tags || [])])];
        
        // Status priority: subscribed > nonsubscribed > unsubscribed > cleaned
        let newStatus = existing.status;
        if (contact.status === "subscribed" && existing.status !== "subscribed") {
          newStatus = "subscribed";
        }
        
        const { error } = await supabase
          .from("newsletter_leads")
          .update({
            first_name: contact.first_name || undefined,
            last_name: contact.last_name || undefined,
            phone: contact.phone || undefined,
            tags: mergedTags.length > 0 ? mergedTags : undefined,
            status: newStatus,
            import_source: contact.import_source,
            imported_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        
        if (error) {
          console.error(`Error updating ${contact.email}:`, error.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Insert new contact
        const { error } = await supabase.from("newsletter_leads").insert({
          email: contact.email,
          first_name: contact.first_name || null,
          last_name: contact.last_name || null,
          phone: contact.phone || null,
          tags: contact.tags && contact.tags.length > 0 ? contact.tags : null,
          status: contact.status,
          source: contact.source,
          import_source: contact.import_source,
          original_source: contact.original_source || null,
          subscribed_at: contact.status === "subscribed" ? new Date().toISOString() : null,
          unsubscribed_at: contact.status === "unsubscribed" ? new Date().toISOString() : null,
          imported_at: new Date().toISOString(),
        });
        
        if (error) {
          console.error(`Error inserting ${contact.email}:`, error.message);
          errors++;
        } else {
          inserted++;
        }
      }
    } catch (err) {
      console.error(`Error processing ${contact.email}:`, err);
      errors++;
    }
  }
  
  return { inserted, updated, errors };
}

async function main() {
  console.log("Starting contact import...\n");
  
  const contactsDir = path.join(process.cwd(), "public", "newcontacts");
  const results: ImportResult[] = [];
  
  // Process contacts-2.csv (Wix)
  const wixFile = path.join(contactsDir, "contacts-2.csv");
  if (fs.existsSync(wixFile)) {
    console.log("Processing contacts-2.csv (Wix format)...");
    const contacts = parseWixContacts(wixFile);
    console.log(`  Found ${contacts.length} contacts`);
    const result = await upsertContacts(contacts);
    results.push({
      file: "contacts-2.csv",
      total: contacts.length,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.updated,
      errors: result.errors,
    });
    console.log(`  Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}\n`);
  }
  
  // Process subscribed export
  const subscribedFile = path.join(contactsDir, "subscribed_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(subscribedFile)) {
    console.log("Processing subscribed_email_audience_export...");
    const contacts = parseMailchimpSubscribed(subscribedFile);
    console.log(`  Found ${contacts.length} contacts`);
    const result = await upsertContacts(contacts);
    results.push({
      file: "subscribed_email_audience_export",
      total: contacts.length,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.updated,
      errors: result.errors,
    });
    console.log(`  Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}\n`);
  }
  
  // Process unsubscribed export
  const unsubscribedFile = path.join(contactsDir, "unsubscribed_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(unsubscribedFile)) {
    console.log("Processing unsubscribed_email_audience_export...");
    const contacts = parseMailchimpUnsubscribed(unsubscribedFile);
    console.log(`  Found ${contacts.length} contacts`);
    const result = await upsertContacts(contacts);
    results.push({
      file: "unsubscribed_email_audience_export",
      total: contacts.length,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.updated,
      errors: result.errors,
    });
    console.log(`  Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}\n`);
  }
  
  // Process cleaned export
  const cleanedFile = path.join(contactsDir, "cleaned_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(cleanedFile)) {
    console.log("Processing cleaned_email_audience_export...");
    const contacts = parseMailchimpCleaned(cleanedFile);
    console.log(`  Found ${contacts.length} contacts`);
    const result = await upsertContacts(contacts);
    results.push({
      file: "cleaned_email_audience_export",
      total: contacts.length,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.updated,
      errors: result.errors,
    });
    console.log(`  Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}\n`);
  }
  
  // Process nonsubscribed export
  const nonsubscribedFile = path.join(contactsDir, "nonsubscribed_email_audience_export_b3eca53876.csv");
  if (fs.existsSync(nonsubscribedFile)) {
    console.log("Processing nonsubscribed_email_audience_export...");
    const contacts = parseMailchimpNonsubscribed(nonsubscribedFile);
    console.log(`  Found ${contacts.length} contacts`);
    const result = await upsertContacts(contacts);
    results.push({
      file: "nonsubscribed_email_audience_export",
      total: contacts.length,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.updated,
      errors: result.errors,
    });
    console.log(`  Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}\n`);
  }
  
  // Summary
  console.log("=".repeat(60));
  console.log("IMPORT SUMMARY");
  console.log("=".repeat(60));
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalProcessed = 0;
  
  for (const r of results) {
    totalProcessed += r.total;
    totalInserted += r.inserted;
    totalUpdated += r.updated;
    totalErrors += r.errors;
  }
  
  console.log(`Total contacts processed: ${totalProcessed}`);
  console.log(`New contacts inserted: ${totalInserted}`);
  console.log(`Existing contacts updated (duplicates): ${totalUpdated}`);
  console.log(`Errors: ${totalErrors}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
