import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get service first
    const { data: service, error } = await supabase
      .from("services")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Service query error:", error);
      return NextResponse.json({ error: "Service not found", details: error.message }, { status: 404 });
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get packages separately
    const { data: packages } = await supabase
      .from("service_packages")
      .select("*")
      .eq("service_id", service.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    service.packages = packages || [];

    // Get menu items separately if it's a walk-in service
    let menuItems: any[] = [];
    if (service.service_type === "walkin_menu") {
      const { data: items } = await supabase
        .from("menu_items")
        .select("*")
        .eq("service_id", service.id)
        .eq("is_available", true)
        .order("display_order", { ascending: true });
      
      menuItems = items || [];
    }

    // Sort packages by display_order
    if (service.packages) {
      service.packages.sort((a: any, b: any) => a.display_order - b.display_order);
    }

    return NextResponse.json({ 
      service,
      menuItems,
    });
  } catch (error: any) {
    console.error("Service detail error:", error);
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
  }
}
