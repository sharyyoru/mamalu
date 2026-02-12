require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Map menu item names to local food images
const imageMap = {
  // Birthday menus
  "Texas Roadhouse": "/images/Baked-Boneless-Honey-BBQ-Chicken-Wings-with-Spicy-Ranch-1-1-500x500.jpg",
  "Little Italy": "/images/Farfalle-Pasta11-scaled.jpg",
  "Funtastic": "/images/Chocolate_Marble_Cookies-BP-1.webp",
  "Kung Fu Panda": "/images/avocado-maki-roll-recipe-10.jpg",
  "Cupcake Masterclass": "/images/Each-Beach-Birthday-Cupcakes.jpg",
  "Dream Diner": "/images/dream diner.jpg",
  "Hola Amigos": "/images/birria-tacos-5-1200x1800.jpg",
  "Cookie Masterclass": "/images/best-chocolate-chip-cookies-recipe-ever-no-chilling-1.jpg",
  "Pretzel Masterclass": "/images/soft-pretzel-snack-board-featured-720x720.jpg",
  "Dumpling Masterclass": "/images/Crispy-Skirt-Dumplings-Takestwoeggs-Final-SQ.jpg",
  "Sushi Masterclass": "/images/avocado-maki-roll-recipe-10.jpg",
  "Healthylicious": "/images/Quinoa-Crusted-Chicken-Tenders-02.jpg",

  // Corporate menus
  "Art of Sushi": "/images/Japanese-Sushi-0458.450-450x270.jpg",
  "Spirit of Thailand": "/images/Fresh-Spring-Rolls-15.jpg",
  "La Cucina Italiana": "/images/chicken-alfredo-lasagna-roll-ups-recipe-4.jpg",
  "The Mexican Table": "/images/Pink-Tacos-4.jpg",
  "Mystery Box Challenge": "/images/Grilled-Steak-with-Chimichurri-1.jpg",
  "Le Petit Menu": "/images/beef-wellington-FT-RECIPE0321-c9a63fccde3b45889ad78fdad078153f.jpg",
  "Dumpling Workshop": "/images/Crispy-rice-paper-dumplings-with-chili-garlic-oil-view-from-top_1718350397_142199.jpeg",
  "Ramen Lab": "/images/shoyu-ramen-1-1200.jpg",

  // Nanny menus
  "Lebanese Essentials": "/images/Musakhan-Rolls-01.jpg",
  "Kibbeh & Vine Leaves": "/images/Pumpkin-Kibbeh.jpg",
  "Vine Leaves Workshop": "/images/Vine-Leaves-with-Cranberries-(Vegetarian).jpg",
  "Manti Making": "/images/Manti-(Meat-Filling).jpg",
  "Ouzi & Rice": "/images/Ouzi.jpg",
  "Pasta from Scratch": "/images/Orecchiete pasta.jpg",
  "Sushi Basics": "/images/avocado-maki-roll-recipe-10.jpg",
  "Ramen Essentials": "/images/vegetable_ramen_noodles-10.jpg",
  "Thai Cooking": "/images/vegetarian-summer-rolls-3.jpg",
  "Mexican Favorites": "/images/taco-cups-6.jpg",
  "Healthy Kids Meals": "/images/Kids-Burgers-01.jpg",
  "Baking Basics": "/images/Honey-Oat-Bread-hi-res-25-1200x1800.jpg",
  "Bread Making": "/images/No-Knead-Focaccia-4.jpg",
  "Soups & Stews": "/images/Lamb-tagine_4.webp",
  "Mediterranean Diet": "/images/Spinach-Pie.jpg",
  "Indian Cooking": "/images/chicken tikka.jpeg",
  "Chinese Cooking": "/images/Savor Authentic Chicken Chow Mein_ Fast and Easy Recipe.jpg",
  "French Basics": "/images/Lemon-Creme-Brulee.jpg",
};

async function assignImages() {
  console.log("Assigning images to menu items...");

  const { data: items, error: fetchError } = await supabase
    .from("menu_items")
    .select("id, name, category, image_url");

  if (fetchError) {
    console.error("Error fetching:", fetchError);
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const imageUrl = imageMap[item.name];
    if (imageUrl && item.image_url !== imageUrl) {
      const { error } = await supabase
        .from("menu_items")
        .update({ image_url: imageUrl })
        .eq("id", item.id);

      if (error) {
        console.error(`  Error updating ${item.name}:`, error.message);
      } else {
        console.log(`  ✓ ${item.name} → ${imageUrl}`);
        updated++;
      }
    } else if (!imageUrl) {
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped (no match): ${skipped}, Total: ${items.length}`);
}

assignImages();
