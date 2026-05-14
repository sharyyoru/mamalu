import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/api-auth";

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Internal server error";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Get user stats from related tables
    const [ordersResult, bookingsResult, rentalsResult] = await Promise.all([
      supabase.from("orders").select("total_amount").eq("customer_id", id),
      supabase.from("class_bookings").select("id").eq("student_id", id),
      supabase.from("rental_bookings").select("total_price").eq("renter_id", id),
    ]);

    const totalRevenue = (ordersResult.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalClasses = bookingsResult.data?.length || 0;
    const totalRentals = rentalsResult.data?.length || 0;
    const rentalRevenue = (rentalsResult.data || []).reduce((sum, r) => sum + (r.total_price || 0), 0);

    return NextResponse.json({
      user,
      stats: {
        totalRevenue: totalRevenue + rentalRevenue,
        totalOrders: ordersResult.data?.length || 0,
        totalClasses,
        totalRentals,
        lifetimeValue: totalRevenue + rentalRevenue,
      },
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Only allow updating specific fields
    const allowedFields = [
      'role', 
      'full_name', 
      'phone', 
      'city', 
      'country', 
      'notes',
      // Instructor-specific fields
      'instructor_title',
      'instructor_bio',
      'instructor_specialties',
      'instructor_experience_years',
      'instructor_image_url',
    ];
    const updateData: Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: currentUser, error: authError } = await verifyAuth(request, ["super_admin"]);

    if (authError || !currentUser) {
      const statusCode = authError?.includes("Access denied") ? 403 : 401;
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: statusCode }
      );
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deletedUser: {
        id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
