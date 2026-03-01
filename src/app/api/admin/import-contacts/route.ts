import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function cleanEmail(email: string | undefined): string | null {
  if (!email) return null;
  const cleaned = email.toLowerCase().trim();
  if (!cleaned.includes("@")) return null;
  return cleaned;
}

function cleanPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.length < 7) return null;
  return cleaned;
}

function parseTags(tagsStr: string | undefined): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .replace(/^"|"$/g, "")
    .split('","')
    .map((t) => t.replace(/"/g, "").trim())
    .filter((t) => t.length > 0);
}

function parseWixContacts(filePath: string): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  for (const record of records) {
    const email = cleanEmail(record["Email 1"]);
    if (!email) continue;
    
    const status = record["Email subscriber status"]?.toLowerCase();
    let contactStatus: Contact["status"] = "subscribed";
    if (status === "never subscribed") contactStatus = "nonsubscribed";
    else if (status === "unsubscribed") contactStatus = "unsubscribed";
    
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

function parseMailchimpExport(filePath: string, status: Contact["status"]): Contact[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Record<string, string>[];
  
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
      status,
      source: "import",
      import_source: path.basename(filePath),
      original_source: "Mailchimp",
    });
  }
  
  return contacts;
}

async function runMigration() {
  // Add columns if they don't exist
  const migrationSQL = `
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'first_name') THEN
        ALTER TABLE newsletter_leads ADD COLUMN first_name TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'last_name') THEN
        ALTER TABLE newsletter_leads ADD COLUMN last_name TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'phone') THEN
        ALTER TABLE newsletter_leads ADD COLUMN phone TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'tags') THEN
        ALTER TABLE newsletter_leads ADD COLUMN tags TEXT[];
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'status') THEN
        ALTER TABLE newsletter_leads ADD COLUMN status TEXT DEFAULT 'subscribed';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'import_source') THEN
        ALTER TABLE newsletter_leads ADD COLUMN import_source TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'original_source') THEN
        ALTER TABLE newsletter_leads ADD COLUMN original_source TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_leads' AND column_name = 'imported_at') THEN
        ALTER TABLE newsletter_leads ADD COLUMN imported_at TIMESTAMPTZ;
      END IF;
    END $$;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();
  if (error && !error.message.includes('does not exist')) {
    console.log("Migration note:", error.message);
  }
  return true;
}

async function upsertContacts(contacts: Contact[]): Promise<{ inserted: number; updated: number; errors: number }> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    
    for (const contact of batch) {
      try {
        const { data: existing } = await supabase
          .from("newsletter_leads")
          .select("id, status, tags")
          .eq("email", contact.email)
          .single();
        
        if (existing) {
          const existingTags = existing.tags || [];
          const mergedTags = [...new Set([...existingTags, ...(contact.tags || [])])];
          
          let newStatus = existing.status || contact.status;
          if (contact.status === "subscribed" && existing.status !== "subscribed") {
            newStatus = "subscribed";
          }
          
          const updateData: Record<string, unknown> = {
            import_source: contact.import_source,
            imported_at: new Date().toISOString(),
          };
          
          if (contact.first_name) updateData.first_name = contact.first_name;
          if (contact.last_name) updateData.last_name = contact.last_name;
          if (contact.phone) updateData.phone = contact.phone;
          if (mergedTags.length > 0) updateData.tags = mergedTags;
          if (newStatus) updateData.status = newStatus;
          
          const { error } = await supabase
            .from("newsletter_leads")
            .update(updateData)
            .eq("id", existing.id);
          
          if (error) {
            errors++;
          } else {
            updated++;
          }
        } else {
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
            errors++;
          } else {
            inserted++;
          }
        }
      } catch {
        errors++;
      }
    }
  }
  
  return { inserted, updated, errors };
}

export async function POST() {
  try {
    // Run migration first
    await runMigration();
    
    const contactsDir = path.join(process.cwd(), "public", "newcontacts");
    const results: { file: string; total: number; inserted: number; updated: number; errors: number }[] = [];
    
    // Process contacts-2.csv (Wix)
    const wixFile = path.join(contactsDir, "contacts-2.csv");
    if (fs.existsSync(wixFile)) {
      const contacts = parseWixContacts(wixFile);
      const result = await upsertContacts(contacts);
      results.push({ file: "contacts-2.csv", total: contacts.length, ...result });
    }
    
    // Process subscribed export
    const subscribedFile = path.join(contactsDir, "subscribed_email_audience_export_b3eca53876.csv");
    if (fs.existsSync(subscribedFile)) {
      const contacts = parseMailchimpExport(subscribedFile, "subscribed");
      const result = await upsertContacts(contacts);
      results.push({ file: "subscribed_export", total: contacts.length, ...result });
    }
    
    // Process unsubscribed export
    const unsubscribedFile = path.join(contactsDir, "unsubscribed_email_audience_export_b3eca53876.csv");
    if (fs.existsSync(unsubscribedFile)) {
      const contacts = parseMailchimpExport(unsubscribedFile, "unsubscribed");
      const result = await upsertContacts(contacts);
      results.push({ file: "unsubscribed_export", total: contacts.length, ...result });
    }
    
    // Process cleaned export
    const cleanedFile = path.join(contactsDir, "cleaned_email_audience_export_b3eca53876.csv");
    if (fs.existsSync(cleanedFile)) {
      const contacts = parseMailchimpExport(cleanedFile, "cleaned");
      const result = await upsertContacts(contacts);
      results.push({ file: "cleaned_export", total: contacts.length, ...result });
    }
    
    // Process nonsubscribed export
    const nonsubscribedFile = path.join(contactsDir, "nonsubscribed_email_audience_export_b3eca53876.csv");
    if (fs.existsSync(nonsubscribedFile)) {
      const contacts = parseMailchimpExport(nonsubscribedFile, "nonsubscribed");
      const result = await upsertContacts(contacts);
      results.push({ file: "nonsubscribed_export", total: contacts.length, ...result });
    }
    
    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        totalProcessed: acc.totalProcessed + r.total,
        totalInserted: acc.totalInserted + r.inserted,
        totalUpdated: acc.totalUpdated + r.updated,
        totalErrors: acc.totalErrors + r.errors,
      }),
      { totalProcessed: 0, totalInserted: 0, totalUpdated: 0, totalErrors: 0 }
    );
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        ...totals,
        duplicatesHandled: totals.totalUpdated,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed", details: String(error) },
      { status: 500 }
    );
  }
}
