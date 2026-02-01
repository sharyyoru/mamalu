import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const serviceType = searchParams.get("type");

    // First, just get services without relations to debug
    let query = supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    if (serviceType) {
      query = query.eq("service_type", serviceType);
    }

    const { data: services, error } = await query;

    if (error) {
      console.error("Fetch services error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get packages for each service
    const servicesWithPackages = await Promise.all(
      (services || []).map(async (service: any) => {
        const { data: packages } = await supabase
          .from("service_packages")
          .select("*")
          .eq("service_id", service.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        
        return { ...service, packages: packages || [] };
      })
    );

    // Group by category for easier frontend consumption
    const grouped = {
      kids: servicesWithPackages.filter(s => s.category === "kids") || [],
      adults: servicesWithPackages.filter(s => s.category === "adults") || [],
      walkin: servicesWithPackages.filter(s => s.category === "walkin") || [],
    };

    return NextResponse.json({ 
      services: servicesWithPackages,
      grouped,
    });
  } catch (error: any) {
    console.error("Services API error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
