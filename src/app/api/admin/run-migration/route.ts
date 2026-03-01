import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Add columns one by one using direct table operations
    // First, let's try to add via raw query through postgres function
    
    const columns = [
      { name: "first_name", type: "TEXT", default: null },
      { name: "last_name", type: "TEXT", default: null },
      { name: "phone", type: "TEXT", default: null },
      { name: "tags", type: "TEXT[]", default: null },
      { name: "status", type: "TEXT", default: "'subscribed'" },
      { name: "import_source", type: "TEXT", default: null },
      { name: "original_source", type: "TEXT", default: null },
      { name: "imported_at", type: "TIMESTAMPTZ", default: null },
    ];

    const results: string[] = [];

    for (const col of columns) {
      // Try to select the column - if it fails, it doesn't exist
      const { error: checkError } = await supabase
        .from("newsletter_leads")
        .select(col.name)
        .limit(1);

      if (checkError && checkError.message.includes("does not exist")) {
        results.push(`Column ${col.name} needs to be added`);
      } else {
        results.push(`Column ${col.name} already exists`);
      }
    }

    return NextResponse.json({
      message: "Migration check complete. Please run this SQL in Supabase Dashboard SQL Editor:",
      sql: `
ALTER TABLE newsletter_leads 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'subscribed',
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS original_source TEXT,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_newsletter_leads_status ON newsletter_leads(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_leads_phone ON newsletter_leads(phone);
      `,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
