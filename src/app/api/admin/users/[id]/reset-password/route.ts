import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      password: newPassword,
    });

    if (error) {
      console.error("Error resetting password:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
