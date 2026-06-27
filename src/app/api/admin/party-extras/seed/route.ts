import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const defaultPartyExtras = [
  { name: "Customized Apron", description: "Personalized Mamalu apron with name", price: 80, image_url: "/personalized-items/apron.jpg", sort_order: 10, metadata: { extra_category: "custom", icon: "gift" } },
  { name: "Customized Spatula", description: "Personalized cooking spatula", price: 50, image_url: "/personalized-items/spatula.jpg", sort_order: 20, metadata: { extra_category: "custom", icon: "utensils" } },
  { name: "Customized Chef Hat", description: "Personalized chef hat", price: 60, image_url: "/personalized-items/chef-hat.jpg", sort_order: 30, metadata: { extra_category: "custom", icon: "gift" } },
  { name: "Customized Mugs", description: "Personalized mug with any design", price: 45, image_url: "/personalized-items/mugs.jpg", sort_order: 40, metadata: { extra_category: "custom", icon: "gift" } },
  { name: "Customized Cakes (10 persons)", description: "Custom designed birthday cake", price: 575, image_url: null, sort_order: 50, metadata: { extra_category: "cake", icon: "cake" } },
  { name: "Customized Cakes (20 persons)", description: "Custom designed birthday cake", price: 700, image_url: null, sort_order: 60, metadata: { extra_category: "cake", icon: "cake" } },
  { name: "Customized Cakes (30 persons)", description: "Custom designed birthday cake", price: 900, image_url: null, sort_order: 70, metadata: { extra_category: "cake", icon: "cake" } },
  { name: "Table Set Up (10 persons)", description: "Plates, cups, spoons, forks, knives, napkins, tablecloth", price: 300, image_url: null, sort_order: 80, metadata: { extra_category: "decor", icon: "utensils" } },
  { name: "Table Set Up (20 persons)", description: "Plates, cups, spoons, forks, knives, napkins, tablecloth", price: 400, image_url: null, sort_order: 90, metadata: { extra_category: "decor", icon: "utensils" } },
  { name: "Table Set Up (30 persons)", description: "Plates, cups, spoons, forks, knives, napkins, tablecloth", price: 500, image_url: null, sort_order: 100, metadata: { extra_category: "decor", icon: "utensils" } },
  { name: "Balloons (14 pcs balloons)", description: "2 bunches of 7 balloons (any color)", price: 260, image_url: null, sort_order: 110, metadata: { extra_category: "decor", icon: "party" } },
  { name: "Mini Pizzas (12pcs)", description: "12 pieces of delicious mini pizzas", price: 50, image_url: "/snacks-and-drinks/SMILEY PIZZA.jpeg", sort_order: 120, metadata: { extra_category: "snacks", icon: "utensils" } },
  { name: "Chicken Tenders (12pcs)", description: "12 pieces of crispy chicken tenders", price: 60, image_url: "/snacks-and-drinks/CHICKEN TENDERS.jpeg", sort_order: 130, metadata: { extra_category: "snacks", icon: "utensils" } },
  { name: "Mini Burgers (6pcs)", description: "6 pieces of mini burgers", price: 70, image_url: "/snacks-and-drinks/mini burgers.jpeg", sort_order: 140, metadata: { extra_category: "snacks", icon: "utensils" } },
  { name: "Musakhan Rolls", description: "Delicious musakhan rolls", price: 50, image_url: "/snacks-and-drinks/MUSAKHAN ROLLS.jpeg", sort_order: 150, metadata: { extra_category: "snacks", icon: "utensils" } },
  { name: "Juices (per pc)", description: "Fresh juice per piece", price: 8, image_url: null, sort_order: 160, metadata: { extra_category: "drinks", icon: "drinks" } },
  { name: "Soft Drinks (per pc)", description: "Soft drink per piece", price: 15, image_url: null, sort_order: 170, metadata: { extra_category: "drinks", icon: "drinks" } },
];

const allowedCategories = new Set(["party_extras", "corporate_party_extras"]);

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "party_extras";
    if (!allowedCategories.has(category)) {
      return NextResponse.json({ error: "Invalid party extras category" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("menu_items")
      .select("name")
      .contains("categories", [category]);

    if (fetchError) throw fetchError;

    const existingNames = new Set((existing || []).map((item) => item.name));
    const missingItems = defaultPartyExtras
      .filter((item) => !existingNames.has(item.name))
      .map((item) => ({
        categories: [category],
        name: item.name,
        description: item.description,
        dishes: [],
        price: item.price,
        price_unit: "per item",
        image_url: item.image_url,
        emoji: null,
        is_active: true,
        is_popular: false,
        sort_order: item.sort_order,
        scheduled_date: null,
        min_guests: null,
        max_guests: null,
        metadata: item.metadata,
      }));

    if (missingItems.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: defaultPartyExtras.length });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert(missingItems)
      .select();

    if (error) throw error;

    return NextResponse.json({ inserted: data?.length || 0, skipped: existingNames.size });
  } catch (error: unknown) {
    console.error("Error seeding party extras:", error);
    const message = error instanceof Error ? error.message : "Failed to seed party extras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
