require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const birthdayMenus = [
  { name: "Texas Roadhouse", price: 275, emoji: "🤠", dishes: ["Baked BBQ wings", "Skillet Mac & Cheese", "Mississippi mud pie"] },
  { name: "Little Italy", price: 250, emoji: "🍕", dishes: ["Pasta from scratch", "Pomodoro sauce", "Margherita pizza", "Fudgy brownies"] },
  { name: "Funtastic", price: 180, emoji: "🎉", dishes: ["Mixed Berry babka", "Cheesy pizza bomb", "Chocolate chip marble cookies"] },
  { name: "Kung Fu Panda", price: 275, emoji: "🐼", dishes: ["California sushi rolls", "Chicken yakitori skewer", "Veggie stir-fried noodles", "Chocolate custard tart"] },
  { name: "Cupcake Masterclass", price: 275, emoji: "🧁", dishes: ["Choose between: Vanilla, chocolate or red velvet cupcakes", "Learn piping skills and decorate to match the season"] },
  { name: "Dream Diner", price: 200, emoji: "🍔", dishes: ["Mini cheesy garlic monkey bread", "Alfredo chicken lasagna rolls", "Oreo Sprinkle skillet cookie"] },
  { name: "Hola Amigos", price: 250, emoji: "🌮", dishes: ["Cheese and mushroom quesadillas", "Pulled chicken tacos", "Churros with chocolate sauce"] },
  { name: "Healthylicious", price: 225, emoji: "🥗", dishes: ["Parmesan baked chicken tenders", "Sweet potato fries", "Double chocolate zucchini muffins"] },
  { name: "Dumpling Masterclass", price: 225, emoji: "🥟", dishes: ["Pan fried mushroom dumplings", "Steamed chicken dumplings", "Chocolate dumplings"] },
  { name: "Pretzel Masterclass", price: 180, emoji: "🥨", dishes: ["Pepperoni pizza pretzel", "Garlic and herb pretzel", "Cinnamon sugar pretzel"] },
  { name: "Mama Mia", price: 250, emoji: "🍝", dishes: ["Bow tie pasta from scratch", "Creamy pink sauce", "Baked chicken milanese", "Chocolate chip biscotti"] },
  { name: "Cookie Masterclass", price: 275, emoji: "🍪", dishes: ["Herb and cheddar cookies", "Funfetti cookies", "Brownie crinkle cookies"] },
];

const corporateMenus = [
  { name: "Spirit of Thailand", price: 300, emoji: "🇹🇭", dishes: ["Shrimp summer rolls", "Thai green chicken curry", "Coconut steamed rice"], is_popular: true },
  { name: "La Cucina Italiana", price: 425, emoji: "🇮🇹", dishes: ["Pasta from scratch with pomodoro or alfredo sauce", "Margherita pizza", "Chicken milanese", "Classic tiramisu"] },
  { name: "The Mexican Table", price: 450, emoji: "🇲🇽", dishes: ["Mexican corn salad", "Tortillas from scratch", "Pulled Mexican chicken or beef", "Guacamole", "Churros with chocolate sauce"] },
  { name: "The Art Of Sushi", price: 450, emoji: "🍣", dishes: ["Miso soup", "Tempura shrimp maki roll", "Spicy tuna handroll", "Salmon avocado roll"] },
  { name: "Pan Asian Feast", price: 475, emoji: "🍜", dishes: ["Ramen with shoyu tare with egg noodles from scratch", "Beef yakitori skewers", "Mushroom gyoza", "Coconut and pandan sago pudding"] },
  { name: "Le Petit Menu", price: 500, emoji: "🇫🇷", dishes: ["French onion tart tatin", "Steak frites (Seared steak with triple cooked fries)", "Le chocolate mousse with olive oil and fleur de sel"] },
  { name: "Umami House", price: 550, emoji: "🏯", dishes: ["Shrimp papaya salad", "Tempura platter", "Chicken katsu curry or teriyaki rib eye donburi bowl with cucumber salad"] },
  { name: "Mystery Box Challenge", price: 550, emoji: "📦", dishes: ["Each team gets assigned random ingredients and are tasked with creating the best dish with guidance from our chef - like Chopped!"] },
];

const nannyMenus = [
  { name: "Lebanese Please 1", price: 1200, emoji: "🇱🇧", dishes: ["Mograhrabieh with chicken", "Molokhiyyeh", "Riz al dajaj"] },
  { name: "Lebanese Please 2", price: 1200, emoji: "🇱🇧", dishes: ["Kibbeh B'laban", "Shish barak", "Kibbeh B'saniyeh"] },
  { name: "Kibbe Masterclass", price: 1200, emoji: "🥙", dishes: ["Pumpkin kibbe", "Lentil kibbe", "Salmon kibbe", "Potato kibbe"] },
  { name: "Kafta Masterclass", price: 1200, emoji: "🍢", dishes: ["Kafta B'saniyeh", "Kafta B'tahini", "Dawood basha with vermicelli rice"] },
  { name: "Stew's for You", price: 1200, emoji: "🍲", dishes: ["Bamiyeh", "Bezelleh", "Loubieh", "Potato stew", "Vermicelli rice"] },
  { name: "Fishtastic", price: 1200, emoji: "🐟", dishes: ["Samki harra", "Sayadieh (spiced fish with aromatic rice)", "Kibbeh samak"] },
  { name: "Roll with It", price: 1200, emoji: "🥬", dishes: ["Classic malfouf (stuffed cabbage rolls)", "Waraa Enab (stuffed vine leaves)"] },
  { name: "Family Friendly", price: 1200, emoji: "👨‍👩‍👧‍👦", dishes: ["Homemade lasagna", "Butter chicken with garlic butter naan", "Asian chicken stir fry noodles"] },
  { name: "Healthy Comfort Food", price: 1200, emoji: "💪", dishes: ["Pulled chicken tacos with guacamole", "Beef stroganoff", "Nut free pesto pasta"] },
  { name: "Asian Special", price: 1200, emoji: "🥢", dishes: ["Shrimp summer rolls", "Asian salmon with jasmine rice", "Asian honey glazed chicken"] },
  { name: "Modern Middleastern", price: 1200, emoji: "🧆", dishes: ["Zataar chicken with sumak potatoes", "Musakhan rolls", "Freekeh salad"] },
  { name: "Dinner Party Starters", price: 1200, emoji: "🥂", dishes: ["Whole roasted cauliflower", "Crispy rice with tuna", "White fish carpaccia with yuzu ponzu sauce"] },
  { name: "Lunch Box Favourites", price: 1200, emoji: "🍱", dishes: ["Oat crusted chicken tenders", "Pizza pinwheels", "Banana oat muffins", "Granola from scratch"] },
  { name: "Japanese Please", price: 1200, emoji: "🇯🇵", dishes: ["Mushroom gyoza", "Ramen with shoyu tare", "Chicken yakitori skewers"] },
  { name: "Thai Special", price: 1200, emoji: "🇹🇭", dishes: ["Asian salad", "Chuck beef bao buns", "Thai green curry with shrimp", "Steamed rice"] },
  { name: "Dinner Party Tarts", price: 1200, emoji: "🥧", dishes: ["Onion tart tatin", "Wild mushroom phyllo tart", "Goat cheese and tomato tart"] },
  { name: "Sushi Masterclass", price: 1200, emoji: "🍣", dishes: ["Salmon and avocado rolls", "Salmon nigiri", "California maki roll"] },
  { name: "Healthy Desserts", price: 1200, emoji: "🍫", dishes: ["Sweet potato brownies", "3 ingredient chocolate cake", "Protein chocolate chip cookies", "Date walnut cake"] },
];

const foodAddOns = [
  { name: "Mini Pizzas", price: 50, emoji: "🍕", dishes: ["12 pieces"], price_unit: "per portion" },
  { name: "Chicken Tenders", price: 60, emoji: "🍗", dishes: ["12 pieces"], price_unit: "per portion" },
  { name: "Mini Burgers", price: 70, emoji: "🍔", dishes: ["12 pieces"], price_unit: "per portion" },
  { name: "Musakhan Rolls", price: 50, emoji: "🥙", dishes: ["12 pieces"], price_unit: "per portion" },
  { name: "Soft Drinks", price: 15, emoji: "🥤", dishes: [], price_unit: "per item" },
  { name: "Juice", price: 8, emoji: "🧃", dishes: [], price_unit: "per item" },
];

const merchAddOns = [
  { name: "Customized Apron", price: 80, emoji: "👨‍🍳", dishes: [], price_unit: "per person" },
  { name: "Customized Chef's Hat", price: 50, emoji: "🎩", dishes: [], price_unit: "per person" },
  { name: "Custom Spatula", price: 50, emoji: "🍳", dishes: [], price_unit: "per item" },
  { name: "Cupcake Goodie Bags", price: 80, emoji: "🧁", dishes: [], price_unit: "per bag" },
  { name: "Pancake Goodie Bags", price: 80, emoji: "🥞", dishes: [], price_unit: "per bag" },
  { name: "Cookie Kits", price: 70, emoji: "🍪", dishes: [], price_unit: "per bag" },
];

async function seed() {
  console.log("Seeding menu items...");

  // Check if already seeded
  const { data: existing } = await supabase.from("menu_items").select("id").limit(1);
  if (existing && existing.length > 0) {
    console.log("Menu items already exist. Skipping seed. Delete all to re-seed.");
    return;
  }

  const allItems = [];

  birthdayMenus.forEach((m, i) => {
    allItems.push({ category: "birthday", name: m.name, price: m.price, emoji: m.emoji, dishes: m.dishes, price_unit: "per person", sort_order: i, is_active: true, is_popular: false });
  });

  corporateMenus.forEach((m, i) => {
    allItems.push({ category: "corporate", name: m.name, price: m.price, emoji: m.emoji, dishes: m.dishes, price_unit: "per person", sort_order: i, is_active: true, is_popular: m.is_popular || false });
  });

  nannyMenus.forEach((m, i) => {
    allItems.push({ category: "nanny", name: m.name, price: m.price, emoji: m.emoji, dishes: m.dishes, price_unit: "flat rate", sort_order: i, is_active: true, is_popular: false });
  });

  foodAddOns.forEach((m, i) => {
    allItems.push({ category: "extras_food", name: m.name, price: m.price, emoji: m.emoji, dishes: m.dishes, price_unit: m.price_unit, sort_order: i, is_active: true, is_popular: false });
  });

  merchAddOns.forEach((m, i) => {
    allItems.push({ category: "extras_merch", name: m.name, price: m.price, emoji: m.emoji, dishes: m.dishes, price_unit: m.price_unit, sort_order: i, is_active: true, is_popular: false });
  });

  const { data, error } = await supabase.from("menu_items").insert(allItems).select();

  if (error) {
    console.error("Error seeding:", error);
  } else {
    console.log(`Seeded ${data.length} menu items successfully!`);
    console.log(`  Birthday: ${birthdayMenus.length}`);
    console.log(`  Corporate: ${corporateMenus.length}`);
    console.log(`  Nanny: ${nannyMenus.length}`);
    console.log(`  Food Add-ons: ${foodAddOns.length}`);
    console.log(`  Merch Add-ons: ${merchAddOns.length}`);
  }
}

seed().catch(console.error);
