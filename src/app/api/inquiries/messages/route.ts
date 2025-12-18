import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Failed to create Supabase client");
    const body = await request.json();
    const { email, message, sender } = body;

    // Find existing contact submission by email
    const { data: existingContact } = await supabase
      .from("contact_submissions")
      .select("id, message")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingContact) {
      // Append message to existing conversation
      const updatedMessage = `${existingContact.message}\n\n[${sender.toUpperCase()} - ${new Date().toLocaleString()}]: ${message}`;
      
      await supabase
        .from("contact_submissions")
        .update({ 
          message: updatedMessage,
          is_read: false 
        })
        .eq("id", existingContact.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
