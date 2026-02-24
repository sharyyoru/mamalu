"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Users,
  Star,
  Crown,
  FileText,
  Calendar,
  Minus,
  Plus,
  ShoppingCart,
  Loader2,
  Sparkles,
  Camera,
  Gift,
  Cake,
  PartyPopper,
  Utensils,
  Music,
  ChefHat,
  MessageCircle,
} from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
  duration_minutes: number;
  includes: string[];
  is_popular: boolean;
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_popular: boolean;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  service_type: string;
  description: string;
  menu_pdf_url: string;
  base_price: number;
  min_guests: number;
  max_guests: number;
  duration_minutes: number;
  features: string[];
  packages: ServicePackage[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ExtraItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;
  category: string;
}

// Corporate Menu Options - Our Classics (from PDF/Excel)
const corporateMenus = [
  { id: "spirit_of_thailand", name: "Spirit of Thailand", price: 300, image: "/images/Fresh-Spring-Rolls-15.jpg", dishes: ["Shrimp summer rolls", "Thai green chicken curry", "Coconut steamed rice"], category: "classics" },
  { id: "la_cucina_italiana", name: "La Cucina Italiana", price: 425, image: "/images/chicken-alfredo-lasagna-roll-ups-recipe-4.jpg", dishes: ["Pasta from scratch with pomodoro or alfredo sauce", "Margherita pizza", "Chicken milanese", "Classic tiramisu"], category: "classics" },
  { id: "the_mexican_table", name: "The Mexican Table", price: 450, image: "/images/Pink-Tacos-4.jpg", dishes: ["Mexican corn salad", "Tortillas from scratch", "Pulled Mexican chicken or beef", "Guacamole", "Churros with chocolate sauce"], category: "classics" },
  { id: "the_art_of_sushi", name: "The Art Of Sushi", price: 450, image: "/images/Japanese-Sushi-0458.450-450x270.jpg", dishes: ["Miso soup", "Tempura shrimp maki roll", "Spicy tuna handroll", "Salmon avocado roll"], category: "classics" },
  { id: "pan_asian_feast", name: "Pan Asian Feast", price: 475, image: "/images/shoyu-ramen-1-1200.jpg", dishes: ["Ramen with shoyu tare with egg noodles from scratch", "Beef yakitori skewers", "Mushroom gyoza", "Coconut and pandan sago pudding"], category: "classics" },
  { id: "le_petit_menu", name: "Le Petit Menu", price: 500, image: "/images/beef-wellington-FT-RECIPE0321-c9a63fccde3b45889ad78fdad078153f.jpg", dishes: ["French onion tart tatin", "Steak frites (Seared steak with triple cooked fries)", "Le chocolate mousse with olive oil and fleur de sel"], category: "classics" },
  { id: "umami_house", name: "Umami House", price: 550, image: "/images/vegetarian-summer-rolls-3.jpg", dishes: ["Shrimp papaya salad", "Tempura platter", "Chicken katsu curry or teriyaki rib eye donburi bowl with cucumber salad"], category: "classics" },
  { id: "mystery_box", name: "Mystery Box Challenge", price: 550, image: "/images/Grilled-Steak-with-Chimichurri-1.jpg", dishes: ["Each team gets assigned random ingredients and are tasked with creating the best dish with guidance from our chef - like Chopped!"], category: "classics" },
];

// Corporate Masterclass Menus (from Excel)
const corporateMasterclassMenus = [
  { id: "bread_baking_masterclass", name: "Bread Baking Masterclass", price: 500, image: "/images/focaccia-bread.jpg", dishes: ["Olive and Zaatar Focaccia", "Mixberry Braided Bread", "Ham and Cheese Pull apart bread"], category: "masterclass" },
  { id: "macaron_masterclass", name: "Macaron Masterclass", price: 550, image: "/images/macarons.jpg", dishes: ["Dark Chocolate Raspberry Macaron", "Mango Macaron", "Pistachio Macaron"], category: "masterclass" },
  { id: "eclaire_masterclass", name: "Eclaire Masterclass", price: 500, image: "/images/eclairs.jpg", dishes: ["Classic Chocolate eclair", "Salted Caramel Eclair", "Vanilla Eclair with Craqualine"], category: "masterclass" },
];

// Corporate Monthly Specials (from Excel - AED 400 each)
const corporateMonthlySpecials = [
  { id: "first_light_suhoor", name: "First Light - Suhoor Kitchen", price: 400, image: "/images/sambousek.jpg", dishes: ["Crispy Beef Sambousek", "Creamy Ricotta filled Qatayef Pockets", "Hydrating Coconut Date Chia shake"], category: "monthly" },
  { id: "iftar_table", name: "The Iftar Table - A Spring Gathering", price: 400, image: "/images/grilled-chicken.jpg", dishes: ["Creamy blended lentil soup with crispy pita bread", "Smoky Grilled chicken with Lemon herb Freekeh & Yogurt Tahini sauce", "Warm semolina cake with orange syrup and pistachio"], category: "monthly" },
  { id: "rooted_plant_based", name: "Rooted & Plant-Based", price: 400, image: "/images/hummus.jpg", dishes: ["Whipped Hummus with warm Pita bread from scratch & olive Tapenade", "Mashed sweet potato top & lentil veggie shepherd's pie", "Rich and silky Dark Chocolate Avocado Mousse with chocolate crunch"], category: "monthly" },
  { id: "artisan_dough_lab", name: "Artisan Dough Lab", price: 400, image: "/images/focaccia-bread.jpg", dishes: ["Rosemary sea salt focaccia", "Caramelised onion & goat cheese mini galette", "Vanilla sugar brioche knots"], category: "monthly" },
  { id: "taste_of_france", name: "A Taste of France", price: 400, image: "/images/ratatouille.jpg", dishes: ["Classic French Mini baked ratatouille in puff pastry shells", "Crispy Duck leg with Sauteed seasonal vegetables", "Creamy Creme Brulee with fresh mix berry Compote"], category: "monthly" },
  { id: "spring_comforts_european", name: "Spring Comforts – European Table", price: 400, image: "/images/roasted-chicken.jpg", dishes: ["Sizzling king prawn with paprika, sherry and garlic infused oil", "Roasted chicken with yorkshire pudding served with seasonal roasted veggie", "Classic british treacle tart with shortcrust pastry and homemade golden syrup"], category: "monthly" },
];

// Nanny Class Menu Options (from PDF/Excel - Mummy's Fabulous Helpers)
// 1200 AED for 4 sessions, 1.5 hours each
const nannyMenus = [
  { id: "lebanese_1", name: "Lebanese Please 1", price: 1200, image: "/images/Musakhan-Rolls-01.jpg", dishes: ["Mograhrabieh with chicken", "Molokhiyyeh", "Riz al dajaj"], category: "nanny" },
  { id: "lebanese_2", name: "Lebanese Please 2", price: 1200, image: "/images/Pumpkin-Kibbeh.jpg", dishes: ["Kibbeh B'laban", "Shish barak", "Kibbeh B'saniyeh"], category: "nanny" },
  { id: "kibbe_masterclass", name: "Kibbe Masterclass", price: 1200, image: "/images/Pumpkin-Kibbeh.jpg", dishes: ["Pumpkin kibbe", "Lentil kibbe", "Salmon kibbe", "Potato kibbe"], category: "nanny" },
  { id: "kafta_masterclass", name: "Kafta Masterclass", price: 1200, image: "/images/Manti-(Meat-Filling).jpg", dishes: ["Kafta B'saniyeh", "Kafta B'tahini", "Dawood basha with vermicelli rice"], category: "nanny" },
  { id: "stews_for_you", name: "Stew's for You", price: 1200, image: "/images/Lamb-tagine_4.webp", dishes: ["Bamiyeh", "Bezelleh", "Loubieh", "Potato stew", "Vermicelli rice"], category: "nanny" },
  { id: "fishtastic", name: "Fishtastic", price: 1200, image: "/images/Pan-Roasted-Hailbut-with-Creamed-Corn-3-1.jpg.webp", dishes: ["Samki harra", "Sayadieh (spiced fish with aromatic rice)", "Kibbeh samak"], category: "nanny" },
  { id: "roll_with_it", name: "Roll with It", price: 1200, image: "/images/Vine-Leaves-with-Cranberries-(Vegetarian).jpg", dishes: ["Classic malfouf (stuffed cabbage rolls)", "Waraa Enab (stuffed vine leaves)"], category: "nanny" },
  { id: "family_friendly", name: "Family Friendly", price: 1200, image: "/images/chicken-alfredo-lasagna-roll-ups-recipe-4.jpg", dishes: ["Homemade lasagna", "Butter chicken with garlic butter naan", "Asian chicken stir fry noodles"], category: "nanny" },
  { id: "healthy_comfort", name: "Healthy Comfort Food", price: 1200, image: "/images/taco-cups-6.jpg", dishes: ["Pulled chicken tacos with guacamole", "Beef stroganoff", "Nut free pesto pasta"], category: "nanny" },
  { id: "asian_special", name: "Asian Special", price: 1200, image: "/images/vegetarian-summer-rolls-3.jpg", dishes: ["Shrimp summer rolls", "Asian salmon with jasmine rice", "Asian honey glazed chicken"], category: "nanny" },
  { id: "modern_middleastern", name: "Modern Middleastern", price: 1200, image: "/images/Musakhan-Rolls-01.jpg", dishes: ["Zataar chicken with sumak potatoes", "Musakhan rolls", "Freekeh salad"], category: "nanny" },
  { id: "dinner_party_starters", name: "Dinner Party Starters", price: 1200, image: "/images/Spicy-Tuna-Crispy-Rice-12.jpg", dishes: ["Whole roasted cauliflower", "Crispy rice with tuna", "White fish carpaccia with yuzu ponzu sauce"], category: "nanny" },
  { id: "lunch_box_favourites", name: "Lunch Box Favourites", price: 1200, image: "/images/Kids-Burgers-01.jpg", dishes: ["Oat crusted chicken tenders", "Pizza pinwheels", "Banana oat muffins", "Granola from scratch"], category: "nanny" },
  { id: "japanese_please", name: "Japanese Please", price: 1200, image: "/images/shoyu-ramen-1-1200.jpg", dishes: ["Mushroom gyoza", "Ramen with shoyu tare", "Chicken yakitori skewers"], category: "nanny" },
  { id: "thai_special", name: "Thai Special", price: 1200, image: "/images/Fresh-Spring-Rolls-15.jpg", dishes: ["Asian salad", "Chuck beef bao buns", "Thai green curry with shrimp", "Steamed rice"], category: "nanny" },
  { id: "dinner_party_tarts", name: "Dinner Party Tarts", price: 1200, image: "/images/Spinach-Pie.jpg", dishes: ["Onion tart tatin", "Wild mushroom phyllo tart", "Goat cheese and tomato tart"], category: "nanny" },
  { id: "sushi_masterclass", name: "Sushi Masterclass", price: 1200, image: "/images/avocado-maki-roll-recipe-10.jpg", dishes: ["Salmon and avocado rolls", "Salmon nigiri", "California maki roll"], category: "nanny" },
  { id: "healthy_desserts", name: "Healthy Desserts", price: 1200, image: "/images/fudgy-sweet-potato-cookies.jpg", dishes: ["Sweet potato brownies", "3 ingredient chocolate cake", "Protein chocolate chip cookies", "Date walnut cake"], category: "nanny" },
];

// Birthdays Menu Packages - Our Classics (from PDF)
const birthdayMenus = [
  { id: "texas_roadhouse", name: "Texas Roadhouse", price: 275, image: "/new-updates/texas road house.jpg", dishes: ["Baked BBQ wings", "Skillet Mac & Cheese", "Mississippi mud pie"], category: "classics" },
  { id: "little_italy", name: "Little Italy", price: 250, image: "/new-updates/little italy.jpg", dishes: ["Pasta from scratch", "Pomodoro sauce", "Margherita pizza", "Fudgy brownies"], category: "classics" },
  { id: "funtastic", name: "Funtastic", price: 180, image: "/new-updates/funtastic.jpg", dishes: ["Mixed Berry babka", "Cheesy pizza bomb", "Chocolate chip marble cookies"], category: "classics" },
  { id: "kung_fu_panda", name: "Kung Fu Panda", price: 275, image: "/new-updates/kungfu panda.jpg", dishes: ["California sushi rolls", "Chicken yakitori skewer", "Veggie stir-fried noodles", "Chocolate custard tart"], category: "classics" },
  { id: "cupcake_masterclass", name: "Cupcake Masterclass", price: 275, image: "/images/Each-Beach-Birthday-Cupcakes.jpg", dishes: ["Choose between: Vanilla, chocolate or red velvet cupcakes", "Learn piping skills and decorate to match the season"], category: "classics" },
  { id: "dream_diner", name: "Dream Diner", price: 200, image: "/new-updates/dream diner.jpg", dishes: ["Mini cheesy garlic monkey bread", "Alfredo chicken lasagna rolls", "Oreo Sprinkle skillet cookie"], category: "classics" },
  { id: "hola_amigos", name: "Hola Amigos", price: 250, image: "/new-updates/hola amigos.jpg", dishes: ["Cheese and mushroom quesadillas", "Pulled chicken tacos", "Churros with chocolate sauce"], category: "classics" },
  { id: "healthylicious", name: "Healthylicious", price: 225, image: "/new-updates/healthylicious.jpg", dishes: ["Parmesan baked chicken tenders", "Sweet potato fries", "Double chocolate zucchini muffins"], category: "classics" },
  { id: "dumpling_masterclass", name: "Dumpling Masterclass", price: 225, image: "/new-updates/dumpling masterclass.jpg", dishes: ["Pan fried mushroom dumplings", "Steamed chicken dumplings", "Chocolate dumplings"], category: "classics" },
  { id: "pretzel_masterclass", name: "Pretzel Masterclass", price: 180, image: "/new-updates/pretzel master class.jpg", dishes: ["Pepperoni pizza pretzel", "Garlic and herb pretzel", "Cinnamon sugar pretzel"], category: "classics" },
  { id: "mama_mia", name: "Mama Mia", price: 250, image: "/images/Farfalle-Pasta11-scaled.jpg", dishes: ["Bow tie pasta from scratch", "Creamy pink sauce", "Baked chicken milanese", "Chocolate biscotti"], category: "classics" },
  { id: "cookie_masterclass", name: "Cookie Masterclass", price: 275, image: "/images/best-chocolate-chip-cookies-recipe-ever-no-chilling-1.jpg", dishes: ["Herb and cheddar cookies", "Funfetti cookies", "Brownie crinkle cookies"], category: "classics" },
];

// Monthly Specials for Kids (from Excel)
const kidsMonthlySpecials = [
  { id: "spring_veggie_adventures", name: "Spring Veggie Adventures", price: 250, image: "/images/Rainbow-Veggie-Pinwheels.jpg", dishes: ["Crispy corn & zucchini bites with yogurt dip", "Rainbow veggie pinwheel wraps", "Lemon blueberry mini cakes"], category: "monthly" },
  { id: "little_bread_makers", name: "Little Bread Makers", price: 250, image: "/images/chocolate-babka-18.jpg", dishes: ["Milk bread rolls from scratch", "Herb & cheese tear-and-share loaf", "Chocolate babka"], category: "monthly" },
  { id: "comfort_food_club", name: "Comfort Food Club", price: 250, image: "/images/chicken-pot-pie-cups.jpg", dishes: ["Creamy chicken pot pie cups", "Baked mac & cheese (macaroni from scratch)", "Soft & Chewy Cinnamon Sugar Blondie Bites"], category: "monthly" },
  { id: "bloom_bakery", name: "Bloom Bakery", price: 250, image: "/images/strawberry-cookies.jpg", dishes: ["Baked Twisted Vanilla Donut", "Strawberry Kiss Cookies", "Colourful Spring time crinkle cookie"], category: "monthly" },
  { id: "asian_kitchen_day", name: "Asian Kitchen Day", price: 250, image: "/images/bao-buns.jpg", dishes: ["Steamed chicken bao buns", "Vegetable lo mein noodles from scratch", "Coconut Palm Sugar pancake rolls"], category: "monthly" },
];

// Mommy & Me Classes (from Excel - AED 375 each)
const mommyAndMeMenus = [
  { id: "sushi_master_class", name: "Sushi Master Class", price: 375, image: "/images/avocado-maki-roll-recipe-10.jpg", dishes: ["California maki rolls", "Vegan hand roll", "Spam masubi"], category: "mommy_me" },
  { id: "bread_baking", name: "Bread Baking", price: 375, image: "/images/garden-focaccia.jpg", dishes: ["Garden focaccia", "Bacon and cheese scrolls", "Cinnamon knots"], category: "mommy_me" },
  { id: "tea_time", name: "Tea Time", price: 375, image: "/images/scones.jpg", dishes: ["Choose between savory option like scones to Petite four"], category: "mommy_me" },
  { id: "bagel_party", name: "Bagel Party", price: 375, image: "/images/homemade-bagels.jpg", dishes: ["Bagel from scratch with sweet and savory toppings"], category: "mommy_me" },
  { id: "cupcake_master_class_mommy", name: "Cupcake Master Class", price: 375, image: "/images/Each-Beach-Birthday-Cupcakes.jpg", dishes: ["Choose between: Vanilla, chocolate or red velvet cupcakes", "Learn piping skills and decorate to match the season"], category: "mommy_me" },
];

// Add-ons/Extras for different service types (from PDFs)
const serviceExtras: Record<string, ExtraItem[]> = {
  birthday_deck: [
    // Custom items from PDF
    { id: "custom_apron", name: "Custom Apron with Name", description: "Personalized Mamalu apron with your name", price: 80, icon: Gift, category: "custom" },
    { id: "custom_chef_hat", name: "Custom Chef Hat", description: "Personalized chef hat with your name", price: 50, icon: Gift, category: "custom" },
    // Birthday Cakes (from PDF)
    { id: "custom_cake_10", name: "Birthday Cake (10 people)", description: "Custom designed birthday cake", price: 575, icon: Cake, category: "cake" },
    { id: "custom_cake_20", name: "Birthday Cake (20 people)", description: "Custom designed birthday cake", price: 700, icon: Cake, category: "cake" },
    { id: "custom_cake_30", name: "Birthday Cake (30 people)", description: "Custom designed birthday cake", price: 900, icon: Cake, category: "cake" },
    { id: "custom_cake_40", name: "Birthday Cake (40 people)", description: "Custom designed birthday cake", price: 1000, icon: Cake, category: "cake" },
    // Decorations
    { id: "balloons", name: "Balloon Bundle", description: "2 bunches of 7 balloons (any color)", price: 260, icon: PartyPopper, category: "decor" },
    { id: "table_setting_10", name: "Table Setting (10 people)", description: "Plates, cups, spoons, forks, knives, napkins, tablecloth in any theme/color", price: 300, icon: Utensils, category: "decor" },
    { id: "table_setting_20", name: "Table Setting (20 people)", description: "Plates, cups, spoons, forks, knives, napkins, tablecloth in any theme/color", price: 400, icon: Utensils, category: "decor" },
    { id: "table_setting_30", name: "Table Setting (30 people)", description: "Plates, cups, spoons, forks, knives, napkins, tablecloth in any theme/color", price: 500, icon: Utensils, category: "decor" },
    // Goodie Bags
    { id: "cupcake_goodie_bag", name: "Cupcake Goodie Bag", description: "Cupcake mix, whisk, cupcake tray, liners, sprinkles", price: 80, icon: Gift, category: "goodie_bags" },
    { id: "pancake_goodie_bag", name: "Pancake Goodie Bag", description: "Pancake mix, whisk/spatula, mini pan, honey bottle, Nutella bottle", price: 80, icon: Gift, category: "goodie_bags" },
    { id: "cookie_kit", name: "Cookie Kit", description: "Flour, sugar, vanilla essence, sprinkles, cookie cutters, recipe", price: 70, icon: Gift, category: "goodie_bags" },
    { id: "custom_mug", name: "Custom Mug", description: "Personalized mug with any design", price: 45, icon: Gift, category: "custom" },
    { id: "custom_spatula", name: "Custom Spatula", description: "Personalized cooking spatula", price: 50, icon: Utensils, category: "custom" },
    // Additional snacks & drinks
    { id: "mini_pizzas", name: "Mini Pizzas", description: "12 pieces of delicious mini pizzas", price: 50, icon: Utensils, category: "snacks" },
    { id: "chicken_tenders", name: "Chicken Tenders", description: "12 pieces of crispy chicken tenders", price: 60, icon: Utensils, category: "snacks" },
    { id: "mini_burgers", name: "Mini Burgers", description: "6 pieces of mini burgers", price: 70, icon: Utensils, category: "snacks" },
    { id: "musakhan_rolls", name: "Musakhan Rolls", description: "12 pieces of musakhan rolls", price: 50, icon: Utensils, category: "snacks" },
    { id: "soft_drinks", name: "Soft Drinks", description: "Per piece", price: 15, icon: Utensils, category: "drinks" },
    { id: "juice", name: "Fresh Juice", description: "Per piece", price: 8, icon: Utensils, category: "drinks" },
  ],
  corporate_deck: [
    // Custom items from PDF
    { id: "custom_apron", name: "Custom Apron with Name", description: "Personalized Mamalu apron with your name", price: 80, icon: Gift, category: "custom" },
    { id: "custom_chef_hat", name: "Custom Chef Hat", description: "Personalized chef hat with your name", price: 50, icon: Gift, category: "custom" },
    { id: "balloons", name: "Balloon Bundle", description: "2 bunches of 7 balloons (any color)", price: 260, icon: PartyPopper, category: "decor" },
    { id: "custom_cake_10", name: "Custom Cake (up to 10 people)", description: "Beautiful custom designed cake", price: 300, icon: Cake, category: "food" },
    { id: "custom_cake_20", name: "Custom Cake (up to 20 people)", description: "Beautiful custom designed cake", price: 700, icon: Cake, category: "food" },
    { id: "custom_cake_30", name: "Custom Cake (up to 30 people)", description: "Beautiful custom designed cake", price: 900, icon: Cake, category: "food" },
    { id: "custom_cake_40", name: "Custom Cake (up to 40 people)", description: "Beautiful custom designed cake", price: 1000, icon: Cake, category: "food" },
    { id: "custom_mug", name: "Custom Mug", description: "Personalized mug with any design", price: 45, icon: Gift, category: "custom" },
    { id: "custom_spatula", name: "Custom Spatula", description: "Personalized cooking spatula", price: 50, icon: Utensils, category: "custom" },
    // Additional snacks & drinks
    { id: "mini_pizzas", name: "Mini Pizzas", description: "12 pieces of delicious mini pizzas", price: 50, icon: Utensils, category: "snacks" },
    { id: "chicken_tenders", name: "Chicken Tenders", description: "12 pieces of crispy chicken tenders", price: 60, icon: Utensils, category: "snacks" },
    { id: "mini_burgers", name: "Mini Burgers", description: "6 pieces of mini burgers", price: 70, icon: Utensils, category: "snacks" },
    { id: "musakhan_rolls", name: "Musakhan Rolls", description: "12 pieces of musakhan rolls", price: 50, icon: Utensils, category: "snacks" },
    { id: "soft_drinks", name: "Soft Drinks", description: "Per piece", price: 15, icon: Utensils, category: "drinks" },
    { id: "juice", name: "Fresh Juice", description: "Per piece", price: 8, icon: Utensils, category: "drinks" },
  ],
  nanny_class: [],
  walkin_menu: [],
};

export default function ServiceBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  
  // Booking state
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<typeof corporateMenus[0] | null>(null);
  const [guestCount, setGuestCount] = useState(6); // Corporate min is 6
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  
  // Service type detection for menu-based pricing
  const isCorporate = service?.service_type === "corporate_deck";
  const isBirthday = service?.service_type === "birthday_deck";
  const isNanny = service?.service_type === "nanny_class";
  const hasMenuSelection = isCorporate || isBirthday || isNanny;
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [allTimeSlots, setAllTimeSlots] = useState<{ start: string; end: string; duration: number; label: string }[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ start: string; end: string; duration: number; label: string }[]>([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<{ start: string; end: string; duration: number; label: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ageRange, setAgeRange] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<"classics" | "monthly" | "mommy_me">("classics");
  const [activeCorporateCategory, setActiveCorporateCategory] = useState<"classics" | "masterclass" | "monthly">("classics");

  // Get available extras for current service
  const availableExtras = service ? (serviceExtras[service.service_type] || []) : [];
  const hasExtras = availableExtras.length > 0;

  useEffect(() => {
    fetchService();
  }, [slug]);

  // Fetch available time slots when date changes
  useEffect(() => {
    async function fetchAvailability() {
      if (!eventDate) {
        setAllTimeSlots([]);
        setAvailableTimeSlots([]);
        setBlockedTimeSlots([]);
        return;
      }

      setLoadingSlots(true);
      setEventTime(""); // Reset selected time when date changes
      
      try {
        const res = await fetch(`/api/services/availability?date=${eventDate}`);
        if (res.ok) {
          const data = await res.json();
          setAllTimeSlots(data.allSlots || []);
          setAvailableTimeSlots(data.availableSlots || []);
          setBlockedTimeSlots(data.blockedSlots || []);
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        setAllTimeSlots([]);
        setAvailableTimeSlots([]);
        setBlockedTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [eventDate]);

  const fetchService = async () => {
    try {
      const res = await fetch(`/api/services/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setService(data.service);
        setMenuItems(data.menuItems || []);
        
        // Auto-select popular package only for non-menu-based services
        const serviceType = data.service?.service_type;
        const isMenuBased = serviceType === "corporate_deck" || serviceType === "birthday_deck" || serviceType === "nanny_class";
        
        if (!isMenuBased) {
          const popular = data.service?.packages?.find((p: ServicePackage) => p.is_popular);
          if (popular) {
            setSelectedPackage(popular);
            setGuestCount(popular.min_guests || 1);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch service:", error);
    } finally {
      setLoading(false);
    }
  };

  const isWalkin = service?.service_type === "walkin_menu";

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0;
  };

  // Extras management
  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      if (prev[extraId]) {
        const { [extraId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [extraId]: 1 };
    });
  };

  const updateExtraQuantity = (extraId: string, delta: number) => {
    setSelectedExtras((prev) => {
      const current = prev[extraId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [extraId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [extraId]: newQty };
    });
  };

  const calculateExtrasTotal = () => {
    return availableExtras.reduce((sum, extra) => {
      const qty = selectedExtras[extra.id] || 0;
      // Per-person extras (like extra_favors, extra_course, etc.)
      const isPerPerson = ["extra_favors", "extra_course", "wine_pairing", "certificates"].includes(extra.id);
      return sum + (extra.price * qty * (isPerPerson ? guestCount : 1));
    }, 0);
  };

  const calculateBaseAmount = () => {
    if (isWalkin) {
      return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    
    // Corporate and Birthday use menu-based pricing (per person)
    if ((isCorporate || isBirthday) && selectedMenu) {
      return selectedMenu.price * guestCount;
    }
    
    // Nanny is flat rate per course (1200 AED for 4 sessions)
    if (isNanny && selectedMenu) {
      return 1200; // Fixed price for 4 sessions
    }
    
    if (!selectedPackage) return 0;
    
    // If price_per_person is set, calculate based on guests
    if (selectedPackage.price_per_person) {
      return selectedPackage.price_per_person * guestCount;
    }
    
    return selectedPackage.price;
  };

  const calculateTotal = () => {
    return calculateBaseAmount() + calculateExtrasTotal();
  };
  
  // Calculate deposit (50%) and balance for corporate and birthday bookings (as per PDF payment policy)
  const totalAmount = calculateTotal();
  const requiresDeposit = isCorporate || isBirthday;
  const depositAmount = requiresDeposit ? Math.ceil(totalAmount * 0.5) : totalAmount;
  const balanceAmount = requiresDeposit ? totalAmount - depositAmount : 0;

  const handleSubmit = async () => {
    if (!service) return;
    
    setSubmitting(true);
    try {
      const totalAmount = calculateTotal();
      
      // Format extras for submission
      const extrasData = availableExtras
        .filter((e) => selectedExtras[e.id])
        .map((e) => ({
          id: e.id,
          name: e.name,
          price: e.price,
          quantity: selectedExtras[e.id],
          isPerPerson: ["extra_favors", "extra_course", "wine_pairing", "certificates"].includes(e.id),
        }));

      // Determine if this is a deposit payment (corporate or birthday) or full payment
      const isDepositPayment = isCorporate || isBirthday;
      const paymentAmount = isDepositPayment ? Math.ceil(totalAmount * 0.5) : totalAmount;

      const res = await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          packageId: selectedPackage?.id,
          serviceType: service.service_type,
          serviceName: service.name,
          packageName: selectedPackage?.name,
          // Corporate menu selection
          menuId: selectedMenu?.id || null,
          menuName: selectedMenu?.name || null,
          menuPrice: selectedMenu?.price || null,
          customerName,
          customerEmail,
          customerPhone,
          companyName,
          eventDate: eventDate || null,
          eventTime: eventTime || null,
          guestCount,
          items: isWalkin ? cart : [],
          extras: extrasData,
          baseAmount: calculateBaseAmount(),
          extrasAmount: calculateExtrasTotal(),
          totalAmount,
          // Split payment info for corporate
          isDepositPayment,
          depositAmount: isDepositPayment ? paymentAmount : null,
          balanceAmount: isDepositPayment ? totalAmount - paymentAmount : null,
          specialRequests,
          ageRange: ageRange || null,
          waiverAccepted,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${minutes} mins`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Service not found</h1>
        <Button asChild>
          <Link href="/book">Back to Services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/book">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">{service.name}</h1>
                <p className="text-sm text-stone-500">
                  {isWalkin ? "Order from our menu" : "Book your experience"}
                </p>
              </div>
            </div>
            {service.menu_pdf_url && (
              <a
                href={service.menu_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
              >
                <FileText className="h-4 w-4" />
                View Full Menu
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Walk-In Customers Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <ChefHat className="h-5 w-5" />
              <span className="font-medium text-sm">Walk-In Customers Welcome!</span>
              <span className="text-white/80 text-sm hidden sm:inline">Feeling spontaneous? Check our last-minute availability</span>
            </div>
            <a
              href="https://wa.me/971527479512?text=Hi!%20I%27d%20like%20to%20check%20walk-in%20availability"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step Indicator */}
            {!isWalkin && (
              <div className="flex items-center gap-2 flex-wrap">
                {(hasExtras ? [1, 2, 3, 4] : [1, 2, 3]).map((s) => {
                  const stepLabels = hasExtras 
                    ? { 1: "Package", 2: "Customize", 3: "Details", 4: "Confirm" }
                    : { 1: "Package", 2: "Details", 3: "Confirm" };
                  const maxStep = hasExtras ? 4 : 3;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          step >= s
                            ? "bg-stone-900 text-white"
                            : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {step > s ? <Check className="h-4 w-4" /> : s}
                      </div>
                      <span className={`text-sm hidden sm:inline ${step >= s ? "text-stone-900" : "text-stone-400"}`}>
                        {stepLabels[s as keyof typeof stepLabels]}
                      </span>
                      {s < maxStep && <div className="w-4 sm:w-8 h-0.5 bg-stone-200" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 1: Menu Selection (Corporate) */}
            {isCorporate && step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Choose Your Menu</h2>
                  <p className="text-stone-500 mt-1">2-hour hands-on cooking experience with professional chefs</p>
                  <p className="text-sm text-stone-400 mt-2">Min: 6 guests • Max: 35 guests</p>
                </div>

                {/* Guest Count Selector */}
                <Card>
                  <CardContent className="p-5">
                    <label className="block text-sm font-medium text-stone-700 mb-3">Number of Guests</label>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => setGuestCount(Math.max(6, guestCount - 1))} disabled={guestCount <= 6}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                      <Button variant="outline" size="icon" onClick={() => setGuestCount(Math.min(35, guestCount + 1))} disabled={guestCount >= 35}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-stone-500">(Min: 6, Max: 35)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
                  <button
                    onClick={() => setActiveCorporateCategory("classics")}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      activeCorporateCategory === "classics"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    🍝 Our Classics
                  </button>
                  <button
                    onClick={() => setActiveCorporateCategory("masterclass")}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      activeCorporateCategory === "masterclass"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    👨‍🍳 Masterclasses
                  </button>
                  <button
                    onClick={() => setActiveCorporateCategory("monthly")}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      activeCorporateCategory === "monthly"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    🌟 Monthly Specials
                  </button>
                </div>

                <div className="grid gap-4">
                  {(activeCorporateCategory === "classics" ? corporateMenus : 
                    activeCorporateCategory === "masterclass" ? corporateMasterclassMenus : 
                    corporateMonthlySpecials).map((menu) => (
                    <Card
                      key={menu.id}
                      className={`cursor-pointer transition-all ${
                        selectedMenu?.id === menu.id
                          ? "ring-2 ring-stone-900 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedMenu(menu)}
                    >
                      <CardContent className="p-0 overflow-hidden">
                        <div className="flex">
                          {menu.image && (
                            <div className="w-32 h-auto flex-shrink-0 relative">
                              <Image src={menu.image} alt={menu.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="p-6 flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-bold text-stone-900">{menu.name}</h3>
                                  {menu.id === "spirit_of_thailand" && (
                                    <Badge className="bg-green-100 text-green-700 border-0">Best Value</Badge>
                                  )}
                                  {menu.id === "mystery_box" && (
                                    <Badge className="bg-purple-100 text-purple-700 border-0">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Challenge
                                    </Badge>
                                  )}
                                  {menu.category === "masterclass" && (
                                    <Badge className="bg-amber-100 text-amber-700 border-0">
                                      <ChefHat className="h-3 w-3 mr-1" />
                                      Masterclass
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="mt-3 space-y-1">
                                  {menu.dishes.map((dish, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      <span>{dish}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-stone-900">
                                  AED {menu.price}
                                </div>
                                <div className="text-sm text-stone-500">per person</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              </div>
            )}

            {/* Step 1: Menu Selection (Birthday) */}
            {isBirthday && step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Choose Your Menu Package</h2>
                  <p className="text-stone-500 mt-1">2-hour private birthday cooking experience</p>
                  <p className="text-sm text-stone-400 mt-2">Min: 6 guests • Max: 35 guests • Price per person</p>
                </div>

                {/* Guest Count Selector */}
                <Card>
                  <CardContent className="p-5">
                    <label className="block text-sm font-medium text-stone-700 mb-3">Number of Kids</label>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => setGuestCount(Math.max(6, guestCount - 1))} disabled={guestCount <= 6}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                      <Button variant="outline" size="icon" onClick={() => setGuestCount(Math.min(35, guestCount + 1))} disabled={guestCount >= 35}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-stone-500">(Min: 6, Max: 35)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
                  <button
                    onClick={() => setActiveMenuCategory("classics")}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      activeMenuCategory === "classics"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    🍭 Our Classics
                  </button>
                  <button
                    onClick={() => setActiveMenuCategory("monthly")}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      activeMenuCategory === "monthly"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    🌟 Monthly Specials
                  </button>
                  <button
                    onClick={() => setActiveMenuCategory("mommy_me")}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      activeMenuCategory === "mommy_me"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    👩‍👧 Mommy & Me
                  </button>
                </div>

                {/* Category Description */}
                {activeMenuCategory === "mommy_me" && (
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <p className="text-pink-800 font-medium">Mom and kid have their own station where they share laughter, learning, and delicious moments together!</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {(activeMenuCategory === "classics" ? birthdayMenus : 
                    activeMenuCategory === "monthly" ? kidsMonthlySpecials : 
                    mommyAndMeMenus).map((menu) => (
                    <Card
                      key={menu.id}
                      className={`cursor-pointer transition-all ${
                        selectedMenu?.id === menu.id
                          ? "ring-2 ring-stone-900 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedMenu(menu)}
                    >
                      <CardContent className="p-0 overflow-hidden">
                        {menu.image && (
                          <div className="relative h-36 w-full">
                            <Image src={menu.image} alt={menu.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-stone-900">{menu.name}</h3>
                            <div className="text-right">
                              <div className="text-xl font-bold text-stone-900">AED {menu.price}</div>
                              <div className="text-xs text-stone-500">per person</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {menu.dishes.map((dish, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                <span>{dish}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              </div>
            )}

            {/* Step 1: Menu Selection (Nanny Class) */}
            {isNanny && step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Choose Your Menu</h2>
                  <p className="text-stone-500 mt-1">Mummy&apos;s Fabulous Helpers - 4 sessions, 1.5 hours each</p>
                  <p className="text-sm text-stone-400 mt-2">Every Monday and Tuesday at 11am</p>
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                    <p className="text-lg font-bold text-amber-800">AED 1,200 for 4 sessions</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nannyMenus.map((menu) => (
                    <Card
                      key={menu.id}
                      className={`cursor-pointer transition-all ${
                        selectedMenu?.id === menu.id
                          ? "ring-2 ring-stone-900 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedMenu(menu)}
                    >
                      <CardContent className="p-0 overflow-hidden">
                        {menu.image && (
                          <div className="relative h-28 w-full">
                            <Image src={menu.image} alt={menu.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-stone-900 mb-2">{menu.name}</h3>
                          <div className="space-y-1">
                            {menu.dishes.map((dish, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-stone-600">
                                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                <span>{dish}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              </div>
            )}

            {/* Step 1: Package Selection (Non-walkin, non-menu-based) */}
            {!isWalkin && !hasMenuSelection && step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Select Your Package</h2>
                
                <div className="grid gap-4">
                  {service.packages?.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? "ring-2 ring-stone-900 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setGuestCount(pkg.min_guests || 1);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-stone-900">{pkg.name}</h3>
                              {pkg.is_popular && (
                                <Badge className="bg-amber-100 text-amber-700 border-0">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-stone-600 mt-1">{pkg.description}</p>
                            
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-stone-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDuration(pkg.duration_minutes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {pkg.min_guests}-{pkg.max_guests} guests
                              </span>
                            </div>

                            {pkg.includes && pkg.includes.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                {(pkg.includes as string[]).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-stone-900">
                              AED {pkg.price.toLocaleString()}
                            </div>
                            {pkg.price_per_person && (
                              <div className="text-sm text-stone-500">
                                AED {pkg.price_per_person}/person
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              </div>
            )}

            {/* Step 2: Customization/Add-ons (when extras available) */}
            {!isWalkin && hasExtras && step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Customize Your Experience</h2>
                  <p className="text-stone-500 mt-1">Add extras to make your event even more special (optional)</p>
                </div>

                {/* Group extras by category */}
                {(() => {
                  const categoryLabels: Record<string, string> = {
                    custom: "🎨 Customized Items",
                    cake: "🎂 Birthday Cakes",
                    decor: "🎈 Decorations",
                    goodie_bags: "🎁 Goodie Bags",
                    snacks: "🍕 Additional Snacks",
                    drinks: "🥤 Drinks",
                  };
                  
                  const categoryOrder = ["custom", "cake", "decor", "goodie_bags", "snacks", "drinks"];
                  const groupedExtras = categoryOrder
                    .map(cat => ({
                      category: cat,
                      label: categoryLabels[cat] || cat,
                      items: availableExtras.filter(e => e.category === cat)
                    }))
                    .filter(group => group.items.length > 0);

                  return groupedExtras.map((group) => (
                    <div key={group.category} className="space-y-3">
                      <h3 className="text-lg font-bold text-stone-800 border-b border-stone-200 pb-2">
                        {group.label}
                      </h3>
                      <div className="grid gap-3">
                        {group.items.map((extra) => {
                          const Icon = extra.icon;
                          const isSelected = selectedExtras[extra.id] > 0;
                          const qty = selectedExtras[extra.id] || 0;
                          const isPerPerson = ["extra_favors", "extra_course", "wine_pairing", "certificates"].includes(extra.id);
                          
                          return (
                            <Card
                              key={extra.id}
                              className={`transition-all ${isSelected ? "ring-2 ring-stone-900 shadow-lg" : "hover:shadow-md"}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-stone-900">{extra.name}</h4>
                                    <p className="text-sm text-stone-500">{extra.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-stone-900">
                                      AED {extra.price}
                                    </p>
                                    {isPerPerson && <p className="text-xs text-stone-500">per person</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isSelected ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          className="h-8 w-8"
                                          onClick={() => updateExtraQuantity(extra.id, -1)}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-6 text-center font-bold">{qty}</span>
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          className="h-8 w-8"
                                          onClick={() => updateExtraQuantity(extra.id, 1)}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleExtra(extra.id)}
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}

              </div>
            )}

            {/* Step 2/3: Event Details (Non-walkin) */}
            {!isWalkin && step === (hasExtras ? 3 : 2) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Event Details</h2>
                
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Guest Count */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Number of Guests
                      </label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setGuestCount(Math.max(hasMenuSelection ? 6 : (selectedPackage?.min_guests || 1), guestCount - 1))}
                          disabled={guestCount <= (hasMenuSelection ? 6 : (selectedPackage?.min_guests || 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setGuestCount(Math.min(hasMenuSelection ? 35 : (selectedPackage?.max_guests || 50), guestCount + 1))}
                          disabled={guestCount >= (hasMenuSelection ? 35 : (selectedPackage?.max_guests || 50))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-stone-500">
                          (Min: {hasMenuSelection ? 6 : selectedPackage?.min_guests}, Max: {hasMenuSelection ? 35 : selectedPackage?.max_guests})
                        </span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Preferred Date
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Preferred Time
                          {loadingSlots && <span className="ml-2 text-xs text-stone-400">(Loading...)</span>}
                        </label>
                        {!eventDate ? (
                          <p className="text-sm text-stone-500 py-3">Please select a date first</p>
                        ) : loadingSlots ? (
                          <div className="flex items-center gap-2 py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                            <span className="text-sm text-stone-500">Checking availability...</span>
                          </div>
                        ) : allTimeSlots.length === 0 ? (
                          <p className="text-sm text-amber-600 py-3">No time slots available for this day. Please select another date.</p>
                        ) : availableTimeSlots.length === 0 ? (
                          <p className="text-sm text-amber-600 py-3">All time slots are booked for this date. Please select another date.</p>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {allTimeSlots.map((slot) => {
                                const isAvailable = availableTimeSlots.some(s => s.start === slot.start);
                                const isSelected = eventTime === slot.start;
                                
                                return (
                                  <button
                                    key={slot.start}
                                    type="button"
                                    disabled={!isAvailable}
                                    onClick={() => setEventTime(slot.start)}
                                    className={`py-3 px-4 rounded-lg text-sm font-medium transition-all text-left ${
                                      isSelected
                                        ? "bg-stone-900 text-white"
                                        : isAvailable
                                          ? "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                          : "bg-stone-50 text-stone-300 cursor-not-allowed line-through"
                                    }`}
                                  >
                                    {slot.label}
                                  </button>
                                );
                              })}
                            </div>
                            {blockedTimeSlots.length > 0 && (
                              <p className="text-xs text-stone-400">
                                * Crossed out times are unavailable due to existing bookings (includes 1-hour prep time between events)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Age Range (for birthday bookings) */}
                    {isBirthday && (
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Age Range of Children *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {["3-6", "7-10", "11-13"].map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => setAgeRange(range)}
                              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                                ageRange === range
                                  ? "bg-stone-900 text-white"
                                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                              }`}
                            >
                              {range} years
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Requests */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Dietary requirements, allergies, theme preferences..."
                        rows={3}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                      />
                    </div>

                    {/* Waiver Acceptance */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverAccepted}
                          onChange={(e) => setWaiverAccepted(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            I accept the Liability Waiver *
                          </p>
                          <p className="text-xs text-stone-600 mt-1">
                            By checking this box, I acknowledge and accept the terms of the Mamalu Kitchen liability waiver. 
                            I understand that cooking activities involve inherent risks including but not limited to burns, 
                            cuts, and allergic reactions. I agree to release Mamalu Kitchen from any liability.
                          </p>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

            {/* Step 3/4: Contact Details (Non-walkin) */}
            {!isWalkin && step === (hasExtras ? 4 : 3) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Your Details</h2>
                
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+971 XX XXX XXXX"
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                      {service.service_type === "corporate_deck" && (
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Your company"
                            className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

            {/* Walk-in Menu */}
            {isWalkin && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-stone-900">Our Menu</h2>
                
                {/* Group items by category */}
                {["appetizer", "main", "dessert", "drink"].map((category) => {
                  const items = menuItems.filter((item) => item.category === category);
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-lg font-bold text-stone-900 capitalize mb-4">
                        {category === "main" ? "Main Courses" : `${category}s`}
                      </h3>
                      <div className="grid gap-4">
                        {items.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-stone-900">{item.name}</h4>
                                    {item.is_popular && (
                                      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                        Popular
                                      </Badge>
                                    )}
                                    {item.is_vegetarian && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        V
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-stone-500 mt-1">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-4 ml-4">
                                  <span className="font-bold text-stone-900">
                                    AED {item.price}
                                  </span>
                                  {getCartQuantity(item.id) > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-6 text-center font-bold">
                                        {getCartQuantity(item.id)}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => addToCart(item)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addToCart(item)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Customer Details for Walk-in */}
                {cart.length > 0 && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-bold text-stone-900">Your Details</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Full Name *"
                          className="px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Email *"
                          className="px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone (Optional)"
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-36">
              <Card className="shadow-lg max-h-[calc(100vh-10rem)] flex flex-col">
                <CardContent className="p-6 flex flex-col min-h-0">
                  <h3 className="text-lg font-bold text-stone-900 mb-4 flex-shrink-0" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>Order Summary</h3>
                  
                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                  {/* Menu-based booking summary (Corporate, Birthday, Nanny) */}
                  {hasMenuSelection && selectedMenu && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-stone-600">{selectedMenu.name}</span>
                        <span className="font-medium">
                          {isNanny ? "4 sessions" : `AED ${selectedMenu.price}/person`}
                        </span>
                      </div>
                      {!isNanny && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Guests</span>
                          <span className="text-stone-600">{guestCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">{isNanny ? "Course Fee" : "Menu Subtotal"}</span>
                        <span className="text-stone-600">
                          AED {isNanny ? "1,200" : (selectedMenu.price * guestCount).toLocaleString()}
                        </span>
                      </div>
                      {eventDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Date</span>
                          <span className="text-stone-600">{new Date(eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {/* Show selected extras */}
                      {Object.keys(selectedExtras).length > 0 && (
                        <>
                          <div className="border-t border-stone-100 pt-3 mt-3">
                            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Add-ons</p>
                            {availableExtras
                              .filter((e) => selectedExtras[e.id])
                              .map((extra) => {
                                const qty = selectedExtras[extra.id];
                                const total = extra.price * qty;
                                return (
                                  <div key={extra.id} className="flex justify-between text-sm py-1">
                                    <span className="text-stone-600">
                                      {extra.name} {qty > 1 ? `×${qty}` : ""}
                                    </span>
                                    <span className="font-medium text-stone-700">
                                      AED {total.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </>
                      )}
                      
                      <div className="border-t border-stone-200 pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>AED {totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* 50% Deposit Notice - for Corporate and Birthday */}
                      {requiresDeposit && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                          <p className="text-sm font-semibold text-amber-800 mb-2">Payment Policy</p>
                          <div className="space-y-1 text-sm text-amber-700">
                            <div className="flex justify-between">
                              <span>50% Deposit (due now)</span>
                              <span className="font-bold">AED {depositAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Balance (48h before event)</span>
                              <span>AED {balanceAmount.toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-amber-600 mt-2">
                            Final attendee numbers must be confirmed 48 hours prior. Goodie bag orders must be confirmed 5 days before.
                          </p>
                        </div>
                      )}
                      
                      {/* Nanny full payment */}
                      {isNanny && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="text-sm font-semibold text-green-800">Full Payment Required</p>
                          <p className="text-xs text-green-600 mt-1">
                            Payment secures your spot for 4 sessions (Mondays & Tuesdays at 11am)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-menu-based package summary */}
                  {!isWalkin && !hasMenuSelection && selectedPackage && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-stone-600">{selectedPackage.name}</span>
                        <span className="font-medium">AED {calculateBaseAmount().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Guests</span>
                        <span className="text-stone-600">{guestCount}</span>
                      </div>
                      {eventDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Date</span>
                          <span className="text-stone-600">{new Date(eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {eventTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Time</span>
                          <span className="text-stone-600">{eventTime}</span>
                        </div>
                      )}
                      
                      {/* Show selected extras */}
                      {Object.keys(selectedExtras).length > 0 && (
                        <>
                          <div className="border-t border-stone-100 pt-3 mt-3">
                            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Add-ons</p>
                            {availableExtras
                              .filter((e) => selectedExtras[e.id])
                              .map((extra) => {
                                const qty = selectedExtras[extra.id];
                                const isPerPerson = ["extra_favors", "extra_course", "wine_pairing", "certificates"].includes(extra.id);
                                const total = extra.price * qty * (isPerPerson ? guestCount : 1);
                                return (
                                  <div key={extra.id} className="flex justify-between text-sm py-1">
                                    <span className="text-stone-600">
                                      {extra.name} {qty > 1 ? `×${qty}` : ""} {isPerPerson ? `(×${guestCount})` : ""}
                                    </span>
                                    <span className="font-medium text-stone-700">
                                      AED {total.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
                            <span className="text-stone-500">Extras Subtotal</span>
                            <span className="font-medium text-stone-700">AED {calculateExtrasTotal().toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {isWalkin && cart.length > 0 && (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-stone-600">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            AED {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedPackage || cart.length > 0) && (
                    <>
                      <div className="border-t border-stone-200 my-4" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>AED {calculateTotal().toLocaleString()}</span>
                      </div>

                      {isWalkin && (
                        <Button
                          className="w-full mt-4 bg-stone-900 hover:bg-stone-800"
                          size="lg"
                          onClick={handleSubmit}
                          disabled={!customerName || !customerEmail || submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Checkout
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {!selectedPackage && !selectedMenu && !isWalkin && (
                    <p className="text-stone-500 text-sm">Select a package to continue</p>
                  )}

                  {isWalkin && cart.length === 0 && (
                    <p className="text-stone-500 text-sm">Add items to your order</p>
                  )}
                  </div>
                  {/* End scrollable content area */}

                  {/* Navigation Buttons - Desktop - Fixed at bottom */}
                  {!isWalkin && (selectedMenu || selectedPackage) && (
                    <div className="mt-6 pt-4 border-t border-stone-200 space-y-3 flex-shrink-0">
                      {/* Step 1: Continue to next step */}
                      {step === 1 && (
                        <Button
                          className="w-full bg-stone-900 hover:bg-stone-800"
                          size="lg"
                          onClick={() => setStep(2)}
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {/* Step 2: Extras - Back and Continue/Skip */}
                      {hasExtras && step === 2 && (
                        <>
                          <Button
                            className="w-full bg-stone-900 hover:bg-stone-800"
                            size="lg"
                            onClick={() => setStep(3)}
                          >
                            {Object.keys(selectedExtras).length > 0 ? "Continue with Extras" : "Skip Extras"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                        </>
                      )}

                      {/* Step 2/3: Event Details - Back and Continue */}
                      {step === (hasExtras ? 3 : 2) && (
                        <>
                          <Button
                            className="w-full bg-stone-900 hover:bg-stone-800"
                            size="lg"
                            onClick={() => setStep(hasExtras ? 4 : 3)}
                            disabled={!waiverAccepted || (isBirthday && !ageRange)}
                          >
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => setStep(hasExtras ? 2 : 1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                        </>
                      )}

                      {/* Step 3/4: Contact Details - Back and Submit */}
                      {step === (hasExtras ? 4 : 3) && (
                        <>
                          <Button
                            className="w-full bg-stone-900 hover:bg-stone-800"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={!customerName || !customerEmail || !customerPhone || submitting}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Proceed to Payment
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => setStep(hasExtras ? 3 : 2)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Order Summary Bar - Deliveroo Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3">
          {/* Show order summary when menu/package selected */}
          {!isWalkin && (selectedMenu || selectedPackage) && (
            <div className="space-y-3">
              {/* Collapsed Summary Row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">
                    {selectedMenu?.name || selectedPackage?.name}
                    {!isNanny && ` • ${guestCount} guests`}
                  </p>
                  <p className="text-lg font-bold text-stone-900">
                    AED {totalAmount.toLocaleString()}
                    {requiresDeposit && (
                      <span className="text-xs font-normal text-stone-500 ml-1">(50% deposit: AED {depositAmount.toLocaleString()})</span>
                    )}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(step - 1)}
                      className="px-3"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {step === 1 && (
                    <Button
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={() => setStep(2)}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  {hasExtras && step === 2 && (
                    <Button
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={() => setStep(3)}
                    >
                      {Object.keys(selectedExtras).length > 0 ? "Continue" : "Skip"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  {step === (hasExtras ? 3 : 2) && (
                    <Button
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={() => setStep(hasExtras ? 4 : 3)}
                      disabled={!waiverAccepted || (isBirthday && !ageRange)}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  {step === (hasExtras ? 4 : 3) && (
                    <Button
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={handleSubmit}
                      disabled={!customerName || !customerEmail || !customerPhone || submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Pay Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Walk-in cart summary */}
          {isWalkin && cart.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">{cart.length} items</p>
                <p className="text-lg font-bold text-stone-900">AED {calculateTotal().toLocaleString()}</p>
              </div>
              <Button
                className="bg-stone-900 hover:bg-stone-800"
                onClick={handleSubmit}
                disabled={!customerName || !customerEmail || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Checkout
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isWalkin && !selectedMenu && !selectedPackage && (
            <p className="text-center text-stone-500 text-sm py-2">Select a menu to continue</p>
          )}
          {isWalkin && cart.length === 0 && (
            <p className="text-center text-stone-500 text-sm py-2">Add items to your order</p>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile to account for floating bar */}
      <div className="lg:hidden h-24" />
    </div>
  );
}
