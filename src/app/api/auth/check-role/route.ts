import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Supabase config check:", { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!serviceRoleKey,
      urlStart: supabaseUrl?.substring(0, 20)
    });

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: "Supabase not configured",
        debug: { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey }
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { userId, email } = await request.json();
    console.log("Check role request:", { userId, email });

    if (!userId && !email) {
      return NextResponse.json({ error: "userId or email required" }, { status: 400 });
    }

    // Try to find profile by ID first
    let profile = null;
    let queryError = null;

    if (userId) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role, full_name")
        .eq("id", userId)
        .single();
      profile = data;
      queryError = error;
      console.log("Profile by ID result:", { data, error: error?.message });
    }

    // Try by email if not found
    if (!profile && email) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role, full_name")
        .eq("email", email)
        .single();
      profile = data;
      queryError = error;
      console.log("Profile by email result:", { data, error: error?.message });
    }

    // If no profile exists, try to create one
    if (!profile && userId) {
      console.log("No profile found, attempting to get auth user...");
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      console.log("Auth user result:", { user: authData?.user?.email, error: authError?.message });

      if (authData?.user) {
        // Check if we should make this user an admin (for wilson@mutant.ae)
        const isWilson = authData.user.email === "wilson@mutant.ae";
        const role = isWilson ? "super_admin" : "customer";

        console.log("Creating profile for:", authData.user.email, "with role:", role);

        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || (isWilson ? "Wilson Admin" : ""),
            role: role,
          })
          .select()
          .single();

        console.log("Insert result:", { newProfile, error: insertError?.message });
        
        if (!insertError) {
          profile = newProfile;
        } else {
          queryError = insertError;
        }
      }
    }

    const hasAdminAccess = profile && ["staff", "admin", "super_admin"].includes(profile.role);
    console.log("Final result:", { profile, hasAdminAccess });

    return NextResponse.json({ 
      profile,
      hasAdminAccess,
      debug: queryError ? { error: queryError.message } : undefined
    });

  } catch (error: any) {
    console.error("Check role error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
