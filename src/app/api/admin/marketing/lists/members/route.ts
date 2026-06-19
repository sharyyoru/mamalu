import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

type IncomingContact = {
  email?: string | null;
  phone?: string | null;
  id?: string | null;
  source?: string | null;
  name?: string | null;
};

const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();
const normalizePhone = (value: unknown) => String(value || "").trim();

const allowedUploadHeaders = new Set(["name", "email", "phone"]);
const normalizeHeader = (header: string) => header.toLowerCase().trim();

function getValue(row: Record<string, unknown>, field: "name" | "email" | "phone") {
  const match = Object.entries(row).find(([key]) => normalizeHeader(key) === field);
  return match?.[1];
}

function parseContactsFromWorkbook(buffer: ArrayBuffer, fileName: string): IncomingContact[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], {
    defval: "",
  });

  const headers = Object.keys(rows[0] || {}).map(normalizeHeader).filter(Boolean);
  const unsupportedHeaders = headers.filter((header) => !allowedUploadHeaders.has(header));
  if (unsupportedHeaders.length > 0) {
    throw new Error(`Upload file can only contain these columns: name, email, phone. Remove: ${unsupportedHeaders.join(", ")}`);
  }

  return rows.map((row) => ({
    email: normalizeEmail(getValue(row, "email")),
    phone: normalizePhone(getValue(row, "phone")),
    name: String(getValue(row, "name") || "").trim() || null,
    source: `uploaded:${fileName}`,
  })).filter((contact) => contact.email || contact.phone);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("contact_list_members")
      .select("id, list_id, name, email, phone, contact_id, contact_source, added_at")
      .eq("list_id", listId)
      .order("added_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, members: [] }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ members: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "";
    let listId: string | null = null;
    let contacts: IncomingContact[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      listId = String(formData.get("listId") || "");
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Excel or CSV file is required" }, { status: 400 });
      }
      contacts = parseContactsFromWorkbook(await file.arrayBuffer(), file.name);
    } else {
      const body = await request.json();
      listId = body.listId;
      contacts = body.contacts || [];
    }

    if (!listId || !contacts || contacts.length === 0) {
      return NextResponse.json({ error: "List ID and contacts are required" }, { status: 400 });
    }

    const seen = new Set<string>();
    const members = contacts
      .map((contact) => {
        const email = normalizeEmail(contact.email);
        const phone = normalizePhone(contact.phone);
        const key = email || phone;
        if (!key || seen.has(key)) return null;
        seen.add(key);
        return {
          list_id: listId,
          email: email || null,
          phone: phone || null,
          contact_id: contact.id || null,
          contact_source: contact.source || null,
          name: contact.name || null,
        };
      })
      .filter(Boolean);

    if (members.length === 0) {
      return NextResponse.json({ error: "No contacts with an email or phone number were found" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("contact_list_members")
      .upsert(members, { onConflict: "list_id,contact_key" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ added: data?.length || 0 });
  } catch (error: any) {
    console.error("Error adding members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const id = String(body.id || "");
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const name = String(body.name || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("contact_list_members")
      .update({
        name: name || null,
        email: email || null,
        phone: phone || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error: any) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");
    const email = searchParams.get("email");

    if (!listId || !email) {
      return NextResponse.json({ error: "List ID and email are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("contact_list_members")
      .delete()
      .eq("list_id", listId)
      .eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
