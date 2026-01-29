import { createAdminClient } from "@/lib/supabase/admin";
import { sanityClient } from "@/lib/sanity/client";

/**
 * WhatsApp Bot - Handles automated responses and booking via WhatsApp
 */

interface BotResponse {
  message: string;
  buttons?: Array<{ id: string; title: string }>;
  listItems?: Array<{ id: string; title: string; description?: string }>;
}

interface ClassInfo {
  _id: string;
  title: string;
  category: string;
  pricePerSession: number;
  fullPrice: number;
  numberOfSessions: number;
  spotsAvailable: number;
  startDate: string;
  description: string;
}

// User session state for multi-step booking
interface UserSession {
  step: "idle" | "browsing" | "selecting_class" | "confirming" | "collecting_info";
  selectedClassId?: string;
  selectedClassName?: string;
  userName?: string;
  userEmail?: string;
  numberOfGuests?: number;
  lastActivity: Date;
}

// In-memory session store (in production, use Redis or database)
const userSessions: Map<string, UserSession> = new Map();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Get or create user session
 */
function getSession(phoneNumber: string): UserSession {
  const existing = userSessions.get(phoneNumber);
  if (existing && Date.now() - existing.lastActivity.getTime() < SESSION_TIMEOUT) {
    existing.lastActivity = new Date();
    return existing;
  }
  
  const newSession: UserSession = {
    step: "idle",
    lastActivity: new Date(),
  };
  userSessions.set(phoneNumber, newSession);
  return newSession;
}

/**
 * Update user session
 */
function updateSession(phoneNumber: string, updates: Partial<UserSession>) {
  const session = getSession(phoneNumber);
  Object.assign(session, updates, { lastActivity: new Date() });
  userSessions.set(phoneNumber, session);
}

/**
 * Process incoming message and generate bot response
 */
export async function processWhatsAppMessage(
  fromNumber: string,
  messageText: string,
  messageType: string = "text"
): Promise<BotResponse> {
  const session = getSession(fromNumber);
  const lowerText = messageText.toLowerCase().trim();

  // Handle button/list responses
  if (messageType === "interactive") {
    return handleInteractiveResponse(fromNumber, messageText, session);
  }

  // Greeting keywords
  if (isGreeting(lowerText)) {
    return getWelcomeMessage();
  }

  // Class inquiry keywords
  if (containsClassKeywords(lowerText)) {
    updateSession(fromNumber, { step: "browsing" });
    return await getClassesMenu();
  }

  // Booking keywords
  if (containsBookingKeywords(lowerText)) {
    updateSession(fromNumber, { step: "browsing" });
    return await getClassesMenu();
  }

  // Category selection
  if (isCategorySelection(lowerText)) {
    const category = extractCategory(lowerText);
    return await getClassesByCategory(category);
  }

  // Handle ongoing conversation based on session state
  switch (session.step) {
    case "collecting_info":
      return handleInfoCollection(fromNumber, messageText, session);
    case "confirming":
      return handleConfirmation(fromNumber, lowerText, session);
    default:
      return getHelpMessage();
  }
}

/**
 * Handle interactive button/list responses
 */
async function handleInteractiveResponse(
  phoneNumber: string,
  responseId: string,
  session: UserSession
): Promise<BotResponse> {
  // Category selections
  if (responseId.startsWith("cat_")) {
    const category = responseId.replace("cat_", "");
    return await getClassesByCategory(category);
  }

  // Class selection
  if (responseId.startsWith("class_")) {
    const classId = responseId.replace("class_", "");
    return await handleClassSelection(phoneNumber, classId);
  }

  // Booking confirmation
  if (responseId === "confirm_booking") {
    return await processBooking(phoneNumber, session);
  }

  if (responseId === "cancel_booking") {
    updateSession(phoneNumber, { step: "idle" });
    return {
      message: "No problem! Your booking has been cancelled. Type 'classes' anytime to browse our offerings. 🍳",
    };
  }

  // Guest count
  if (responseId.startsWith("guests_")) {
    const count = parseInt(responseId.replace("guests_", ""));
    updateSession(phoneNumber, { numberOfGuests: count, step: "collecting_info" });
    return {
      message: `Great! ${count} guest(s) confirmed.\n\nPlease provide your details:\n\n*Name:* (type your full name)`,
    };
  }

  return getHelpMessage();
}

/**
 * Handle class selection
 */
async function handleClassSelection(phoneNumber: string, classId: string): Promise<BotResponse> {
  const classInfo = await getClassById(classId);
  
  if (!classInfo) {
    return { message: "Sorry, that class is no longer available. Please select another class." };
  }

  if (classInfo.spotsAvailable <= 0) {
    return { message: `Sorry, *${classInfo.title}* is fully booked. Would you like to see other classes?` };
  }

  updateSession(phoneNumber, {
    step: "selecting_class",
    selectedClassId: classId,
    selectedClassName: classInfo.title,
  });

  const startDate = classInfo.startDate 
    ? new Date(classInfo.startDate).toLocaleDateString("en-AE", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })
    : "TBA";

  return {
    message: `📚 *${classInfo.title}*\n\n${classInfo.description}\n\n` +
      `📅 *Start Date:* ${startDate}\n` +
      `⏱ *Sessions:* ${classInfo.numberOfSessions}\n` +
      `💰 *Price:* AED ${classInfo.fullPrice}\n` +
      `👥 *Spots Available:* ${classInfo.spotsAvailable}\n\n` +
      `Would you like to book this class? Select number of guests:`,
    buttons: [
      { id: "guests_1", title: "1 Guest" },
      { id: "guests_2", title: "2 Guests" },
      { id: "guests_3", title: "3+ Guests" },
    ],
  };
}

/**
 * Handle info collection during booking
 */
function handleInfoCollection(
  phoneNumber: string,
  text: string,
  session: UserSession
): BotResponse {
  // If we don't have name yet
  if (!session.userName) {
    updateSession(phoneNumber, { userName: text });
    return {
      message: `Thanks, *${text}*! 👋\n\nNow please provide your *email address* for booking confirmation:`,
    };
  }

  // If we don't have email yet
  if (!session.userEmail) {
    if (!isValidEmail(text)) {
      return { message: "Please provide a valid email address:" };
    }
    updateSession(phoneNumber, { userEmail: text, step: "confirming" });
    
    return {
      message: `Perfect! Please confirm your booking:\n\n` +
        `📚 *Class:* ${session.selectedClassName}\n` +
        `👤 *Name:* ${session.userName}\n` +
        `📧 *Email:* ${text}\n` +
        `👥 *Guests:* ${session.numberOfGuests || 1}\n` +
        `📱 *Phone:* ${phoneNumber}\n\n` +
        `Confirm this booking?`,
      buttons: [
        { id: "confirm_booking", title: "✅ Confirm" },
        { id: "cancel_booking", title: "❌ Cancel" },
      ],
    };
  }

  return getHelpMessage();
}

/**
 * Handle booking confirmation
 */
function handleConfirmation(
  phoneNumber: string,
  text: string,
  session: UserSession
): BotResponse {
  if (text.includes("yes") || text.includes("confirm")) {
    return processBooking(phoneNumber, session) as any;
  }
  
  if (text.includes("no") || text.includes("cancel")) {
    updateSession(phoneNumber, { step: "idle" });
    return {
      message: "No problem! Your booking has been cancelled. Type 'classes' anytime to browse our offerings. 🍳",
    };
  }

  return {
    message: "Please confirm by selecting a button or typing 'yes' or 'no':",
    buttons: [
      { id: "confirm_booking", title: "✅ Confirm" },
      { id: "cancel_booking", title: "❌ Cancel" },
    ],
  };
}

/**
 * Process the actual booking
 */
async function processBooking(phoneNumber: string, session: UserSession): Promise<BotResponse> {
  if (!session.selectedClassId || !session.userName || !session.userEmail) {
    updateSession(phoneNumber, { step: "idle" });
    return { message: "Sorry, something went wrong. Please start your booking again by typing 'book class'." };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { message: "Sorry, our booking system is temporarily unavailable. Please try again later." };
  }

  try {
    // Fetch class details from Sanity
    const classData = await sanityClient.fetch(`
      *[_type == "cookingClass" && _id == $classId][0] {
        _id,
        title,
        pricePerSession,
        fullPrice,
        numberOfSessions,
        spotsAvailable,
        classType
      }
    `, { classId: session.selectedClassId });

    if (!classData || classData.spotsAvailable < (session.numberOfGuests || 1)) {
      return { message: "Sorry, this class is no longer available or doesn't have enough spots. Please select another class." };
    }

    const totalAmount = classData.fullPrice * (session.numberOfGuests || 1);

    // Create booking in Supabase
    const bookingData = {
      class_id: session.selectedClassId,
      class_title: classData.title,
      class_type: classData.classType || "in-person",
      attendee_name: session.userName,
      attendee_email: session.userEmail,
      attendee_phone: phoneNumber,
      payment_type: "full_course",
      sessions_booked: classData.numberOfSessions,
      total_sessions: classData.numberOfSessions,
      price_per_session: classData.pricePerSession || 0,
      total_amount: totalAmount,
      amount_due: totalAmount,
      amount_paid: 0,
      currency: "AED",
      status: "pending",
      payment_method: "pending",
      number_of_guests: session.numberOfGuests || 1,
      notes: `Booked via WhatsApp\nGuests: ${session.numberOfGuests || 1}`,
      booking_source: "whatsapp",
    };

    const { data: booking, error } = await supabase
      .from("class_bookings")
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error("WhatsApp booking error:", error);
      return { message: "Sorry, there was an error creating your booking. Please try again or contact us directly." };
    }

    // Update spots in Sanity
    try {
      await sanityClient
        .patch(session.selectedClassId)
        .dec({ spotsAvailable: session.numberOfGuests || 1 })
        .commit();
    } catch (e) {
      console.error("Failed to update Sanity spots:", e);
    }

    // Log WhatsApp booking in database
    try {
      await supabase.from("whatsapp_bookings").insert({
        booking_id: booking.id,
        phone_number: phoneNumber,
        booking_number: booking.booking_number,
        class_title: classData.title,
        total_amount: totalAmount,
      });
    } catch (e) {
      console.error("Failed to log WhatsApp booking:", e);
    }

    // Reset session
    updateSession(phoneNumber, { step: "idle" });

    return {
      message: `🎉 *Booking Confirmed!*\n\n` +
        `Your booking reference: *${booking.booking_number}*\n\n` +
        `📚 *Class:* ${classData.title}\n` +
        `👥 *Guests:* ${session.numberOfGuests || 1}\n` +
        `💰 *Total:* AED ${totalAmount}\n\n` +
        `📧 A confirmation email will be sent to ${session.userEmail}\n\n` +
        `To complete your booking, please make payment via:\n` +
        `• Bank transfer\n` +
        `• Card payment (link will be sent)\n\n` +
        `Thank you for choosing Mamalu Kitchen! 🍳❤️`,
    };
  } catch (error) {
    console.error("Booking processing error:", error);
    return { message: "Sorry, there was an error processing your booking. Please try again later." };
  }
}

/**
 * Get classes menu with categories
 */
async function getClassesMenu(): Promise<BotResponse> {
  return {
    message: "🍳 *Mamalu Kitchen Classes*\n\n" +
      "What type of class are you interested in?\n\n" +
      "👶 *Kids* - Fun cooking for little chefs\n" +
      "👨‍👩‍👧 *Family* - Cook together as a family\n" +
      "🎂 *Birthday* - Party packages\n" +
      "👨‍🍳 *Adults* - Master new cuisines\n\n" +
      "Select a category below:",
    buttons: [
      { id: "cat_kids", title: "👶 Kids" },
      { id: "cat_family", title: "👨‍👩‍👧 Family" },
      { id: "cat_adults", title: "👨‍🍳 Adults" },
    ],
  };
}

/**
 * Get classes by category
 */
async function getClassesByCategory(category: string): Promise<BotResponse> {
  try {
    const classes: ClassInfo[] = await sanityClient.fetch(`
      *[_type == "cookingClass" && category == $category && spotsAvailable > 0] | order(startDate asc) [0...5] {
        _id,
        title,
        category,
        pricePerSession,
        fullPrice,
        numberOfSessions,
        spotsAvailable,
        startDate,
        description
      }
    `, { category });

    if (!classes || classes.length === 0) {
      return {
        message: `No ${category} classes available right now. Would you like to see other categories?`,
        buttons: [
          { id: "cat_kids", title: "👶 Kids" },
          { id: "cat_family", title: "👨‍👩‍👧 Family" },
          { id: "cat_adults", title: "👨‍🍳 Adults" },
        ],
      };
    }

    const categoryEmoji = {
      kids: "👶",
      family: "👨‍👩‍👧",
      birthday: "🎂",
      adults: "👨‍🍳",
    }[category] || "📚";

    let message = `${categoryEmoji} *${category.charAt(0).toUpperCase() + category.slice(1)} Classes*\n\n`;
    
    classes.forEach((cls, i) => {
      const date = cls.startDate 
        ? new Date(cls.startDate).toLocaleDateString("en-AE", { month: "short", day: "numeric" })
        : "TBA";
      message += `${i + 1}. *${cls.title}*\n`;
      message += `   📅 ${date} | 💰 AED ${cls.fullPrice} | 👥 ${cls.spotsAvailable} spots\n\n`;
    });

    message += "Select a class to book:";

    return {
      message,
      listItems: classes.map((cls, i) => ({
        id: `class_${cls._id}`,
        title: cls.title,
        description: `AED ${cls.fullPrice} - ${cls.spotsAvailable} spots`,
      })),
    };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { message: "Sorry, we couldn't load the classes. Please try again later." };
  }
}

/**
 * Get class by ID
 */
async function getClassById(classId: string): Promise<ClassInfo | null> {
  try {
    return await sanityClient.fetch(`
      *[_type == "cookingClass" && _id == $classId][0] {
        _id,
        title,
        category,
        pricePerSession,
        fullPrice,
        numberOfSessions,
        spotsAvailable,
        startDate,
        description
      }
    `, { classId });
  } catch {
    return null;
  }
}

/**
 * Get welcome message
 */
function getWelcomeMessage(): BotResponse {
  return {
    message: "👋 *Welcome to Mamalu Kitchen!*\n\n" +
      "I'm here to help you with:\n\n" +
      "🍳 *Classes* - Browse & book cooking classes\n" +
      "📅 *Bookings* - Check your reservations\n" +
      "❓ *Info* - Learn about our services\n\n" +
      "How can I help you today?",
    buttons: [
      { id: "cat_all", title: "📚 View Classes" },
      { id: "info_contact", title: "📞 Contact Us" },
    ],
  };
}

/**
 * Get help message
 */
function getHelpMessage(): BotResponse {
  return {
    message: "I'm not sure I understood that. 🤔\n\n" +
      "Here's what I can help you with:\n\n" +
      "• Type *'classes'* to browse cooking classes\n" +
      "• Type *'book'* to start a booking\n" +
      "• Type *'kids'*, *'family'*, or *'adults'* for specific categories\n" +
      "• Type *'hello'* to start over\n\n" +
      "Or select an option below:",
    buttons: [
      { id: "cat_all", title: "📚 View Classes" },
      { id: "info_contact", title: "📞 Contact Us" },
    ],
  };
}

// Helper functions
function isGreeting(text: string): boolean {
  const greetings = ["hi", "hello", "hey", "hola", "marhaba", "salam", "good morning", "good afternoon", "good evening", "start"];
  return greetings.some(g => text.includes(g));
}

function containsClassKeywords(text: string): boolean {
  const keywords = ["class", "classes", "course", "courses", "learn", "cooking", "lesson", "lessons", "workshop"];
  return keywords.some(k => text.includes(k));
}

function containsBookingKeywords(text: string): boolean {
  const keywords = ["book", "reserve", "sign up", "register", "enroll", "join"];
  return keywords.some(k => text.includes(k));
}

function isCategorySelection(text: string): boolean {
  const categories = ["kids", "family", "birthday", "adults", "children", "adult"];
  return categories.some(c => text.includes(c));
}

function extractCategory(text: string): string {
  if (text.includes("kid") || text.includes("children")) return "kids";
  if (text.includes("family")) return "family";
  if (text.includes("birthday")) return "birthday";
  if (text.includes("adult")) return "adults";
  return "all";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Send WhatsApp message via Meta API
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  response: BotResponse
): Promise<boolean> {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    let body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
    };

    if (response.buttons && response.buttons.length > 0) {
      // Interactive button message
      body.type = "interactive";
      body.interactive = {
        type: "button",
        body: { text: response.message },
        action: {
          buttons: response.buttons.map(btn => ({
            type: "reply",
            reply: { id: btn.id, title: btn.title },
          })),
        },
      };
    } else if (response.listItems && response.listItems.length > 0) {
      // Interactive list message
      body.type = "interactive";
      body.interactive = {
        type: "list",
        body: { text: response.message },
        action: {
          button: "Select Class",
          sections: [
            {
              title: "Available Classes",
              rows: response.listItems.map(item => ({
                id: item.id,
                title: item.title.substring(0, 24),
                description: item.description?.substring(0, 72),
              })),
            },
          ],
        },
      };
    } else {
      // Simple text message
      body.type = "text";
      body.text = { body: response.message };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("WhatsApp send error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}
