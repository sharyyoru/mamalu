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

// Related admin payloads come from several independently-shaped Supabase tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordMap = Record<string, any>;
// Dynamic admin cleanup touches optional tables/columns from several migrations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminSupabaseClient = ReturnType<typeof createClient<any>>;

const normalizeEmail = (email?: string | null) => String(email || "").trim().toLowerCase();

const normalizePhone = (phone?: string | null) => String(phone || "").replace(/\D/g, "");

const ignorableReferenceCleanupErrorCodes = new Set([
  "42P01",
  "42501",
  "42703",
  "PGRST200",
  "PGRST204",
  "PGRST205",
]);

type NullableReference = {
  table: string;
  column: string;
};

const nullableUserReferences: NullableReference[] = [
  { table: "profiles", column: "referred_by" },
  { table: "leads", column: "assigned_to" },
  { table: "leads", column: "converted_to_user_id" },
  { table: "class_bookings", column: "user_id" },
  { table: "class_bookings", column: "checked_in_by" },
  { table: "class_bookings", column: "receipt_verified_by" },
  { table: "service_bookings", column: "user_id" },
  { table: "service_bookings", column: "created_by" },
  { table: "service_bookings", column: "checked_in_by" },
  { table: "payment_links", column: "created_by" },
  { table: "payment_links", column: "status_changed_by" },
  { table: "invoices", column: "created_by" },
  { table: "payment_transactions", column: "processed_by" },
  { table: "lead_bookings", column: "created_by" },
  { table: "whatsapp_cash_mentions", column: "reviewed_by" },
  { table: "site_content", column: "updated_by" },
  { table: "marketing_campaigns", column: "created_by" },
  { table: "discount_codes", column: "created_by" },
  { table: "discount_usage", column: "profile_id" },
  { table: "campaign_recipients", column: "profile_id" },
  { table: "referrals", column: "referrer_id" },
  { table: "referrals", column: "referee_id" },
  { table: "email_templates", column: "created_by" },
];

function isIgnorableSchemaError(error: { code?: string; message?: string }) {
  return Boolean(
    error.code && ignorableReferenceCleanupErrorCodes.has(error.code)
  ) || /Could not find|does not exist|permission denied|schema cache/i.test(error.message || "");
}

async function clearUserReferences(
  supabase: AdminSupabaseClient,
  userId: string
) {
  const errors = [];

  for (const reference of nullableUserReferences) {
    const { error } = await supabase
      .from(reference.table)
      .update({ [reference.column]: null })
      .eq(reference.column, userId);

    if (error && !isIgnorableSchemaError(error)) {
      errors.push({ ...reference, error });
    }
  }

  return errors;
}

const toNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getDateValue = (record: RecordMap, fields: string[]) =>
  fields.map((field) => record[field]).find(Boolean) || null;

const sortByNewest = <T extends RecordMap>(items: T[], fields: string[]) =>
  [...items].sort((a, b) => {
    const aTime = new Date(getDateValue(a, fields) || 0).getTime();
    const bTime = new Date(getDateValue(b, fields) || 0).getTime();
    return bTime - aTime;
  });

const uniqueValues = (values: Array<string | null | undefined>) => [
  ...new Set(values.filter((value): value is string => Boolean(value))),
];

const createActivity = (
  id: string,
  type: "order" | "booking" | "voucher" | "rental",
  description: string,
  amount: number | null,
  date: string | null,
  status: string | null
) => ({
  id,
  type,
  description,
  amount,
  date,
  status: status || "unknown",
});

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

    const email = normalizeEmail(user.email);
    const phone = normalizePhone(user.phone);

    const [ordersResult, classBookingsResult, serviceBookingsResult, voucherPurchasesResult, voucherRedemptionsResult, leadsResult] = await Promise.all([
      email
        ? supabase.from("product_orders").select("*").ilike("customer_email", email).order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      email
        ? supabase.from("class_bookings").select("*").or(`user_id.eq.${id},attendee_email.ilike.${email}`).order("created_at", { ascending: false })
        : supabase.from("class_bookings").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      email
        ? supabase.from("service_bookings").select("*").or(`user_id.eq.${id},customer_email.ilike.${email}`).order("created_at", { ascending: false })
        : supabase.from("service_bookings").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      email
        ? supabase.from("voucher_purchases").select("*").ilike("customer_email", email).order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      email
        ? supabase.from("voucher_redemptions").select("*").ilike("customer_email", email).order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      email || phone
        ? supabase
            .from("leads")
            .select("*")
            .or([
              email ? `email.ilike.${email}` : "",
              phone ? `phone.ilike.%${phone}%` : "",
              phone && user.phone ? `phone.ilike.%${user.phone}%` : "",
            ].filter(Boolean).join(","))
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const queryErrors = [
      ordersResult.error,
      classBookingsResult.error,
      serviceBookingsResult.error,
      voucherPurchasesResult.error,
      voucherRedemptionsResult.error,
      leadsResult.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      console.error("Error fetching user related data:", queryErrors);
      return NextResponse.json({ error: queryErrors[0]?.message || "Failed to fetch user activity" }, { status: 500 });
    }

    const orders = (ordersResult.data || []) as RecordMap[];
    const classBookings = (classBookingsResult.data || []) as RecordMap[];
    const serviceBookings = (serviceBookingsResult.data || []) as RecordMap[];
    const voucherPurchases = (voucherPurchasesResult.data || []) as RecordMap[];
    const voucherRedemptions = (voucherRedemptionsResult.data || []) as RecordMap[];
    const rentals = ((leadsResult.data || []) as RecordMap[]).filter((lead) => {
      const joined = [
        lead.lead_type,
        lead.source,
        lead.notes,
        lead.interest,
        lead.interests,
      ].flat().filter(Boolean).join(" ").toLowerCase();

      return joined.includes("rental") || joined.includes("renter") || joined.includes("kitchen studio");
    });

    const bookings = sortByNewest(
      [
        ...classBookings.map((booking): RecordMap => ({ ...booking, booking_kind: "class" })),
        ...serviceBookings.map((booking): RecordMap => ({ ...booking, booking_kind: "service" })),
      ],
      ["created_at", "event_date", "paid_at"]
    );

    const vouchers = sortByNewest(
      [
        ...voucherPurchases.map((voucher): RecordMap => ({ ...voucher, voucher_kind: "purchase" })),
        ...voucherRedemptions.map((voucher): RecordMap => ({ ...voucher, voucher_kind: "redemption" })),
      ],
      ["created_at", "redeemed_at", "paid_at", "event_date"]
    );

    let invoices: RecordMap[] = [];
    const invoiceFilters: string[] = [];
    const serviceBookingIds = uniqueValues(serviceBookings.map((booking) => booking.id));
    const classBookingIds = uniqueValues(classBookings.map((booking) => booking.id));
    const productOrderIds = uniqueValues(orders.map((order) => order.id));
    const voucherPurchaseIds = uniqueValues(voucherPurchases.map((voucher) => voucher.id));
    const invoiceNumbers = uniqueValues([
      ...classBookings.map((booking) => booking.invoice_number),
      ...serviceBookings.map((booking) => booking.invoice_number),
      ...orders.map((order) => order.invoice_number),
      ...voucherPurchases.map((voucher) => voucher.invoice_number),
    ]);

    if (email) invoiceFilters.push(`customer_email.ilike.${email}`);
    if (serviceBookingIds.length > 0) invoiceFilters.push(`service_booking_id.in.(${serviceBookingIds.join(",")})`);
    if (classBookingIds.length > 0) invoiceFilters.push(`booking_id.in.(${classBookingIds.join(",")})`);
    if (productOrderIds.length > 0) invoiceFilters.push(`product_order_id.in.(${productOrderIds.join(",")})`);
    if (voucherPurchaseIds.length > 0) invoiceFilters.push(`voucher_purchase_id.in.(${voucherPurchaseIds.join(",")})`);
    if (invoiceNumbers.length > 0) invoiceFilters.push(`invoice_number.in.(${invoiceNumbers.join(",")})`);

    if (invoiceFilters.length > 0) {
      const { data: invoiceRows, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .or(invoiceFilters.join(","))
        .order("created_at", { ascending: false })
        .limit(100);

      if (invoicesError) {
        console.warn(`Error fetching user invoices: ${invoicesError.message}`);

        if (email) {
          const { data: fallbackInvoices, error: fallbackInvoicesError } = await supabase
            .from("invoices")
            .select("*")
            .ilike("customer_email", email)
            .order("created_at", { ascending: false })
            .limit(100);

          if (fallbackInvoicesError) {
            console.warn(`Fallback user invoice lookup failed: ${fallbackInvoicesError.message}`);
          } else {
            invoices = fallbackInvoices || [];
          }
        }
      } else {
        invoices = invoiceRows || [];
      }
    }

    const orderSpend = orders.reduce((sum, order) => sum + toNumber(order.total_amount), 0);
    const bookingSpend = bookings.reduce((sum, booking) => sum + toNumber(booking.total_amount), 0);
    const voucherSpend = voucherPurchases
      .filter((voucher) => voucher.status === "paid" || Boolean(voucher.paid_at))
      .reduce((sum, voucher) => sum + toNumber(voucher.amount), 0);
    const totalSpend = orderSpend + bookingSpend + voucherSpend;
    const paidOrderCount = orders.filter((order) => order.payment_status === "paid" || order.status === "paid" || Boolean(order.paid_at)).length;
    const averageOrderValue = paidOrderCount > 0 ? orderSpend / paidOrderCount : 0;

    const activity = sortByNewest(
      [
        ...orders.map((order) => createActivity(
          `order-${order.id}`,
          "order",
          `Order ${order.order_number || order.id}`,
          toNumber(order.total_amount),
          getDateValue(order, ["created_at", "paid_at"]),
          order.status || order.payment_status
        )),
        ...bookings.map((booking) => createActivity(
          `booking-${booking.booking_kind}-${booking.id}`,
          "booking",
          booking.booking_kind === "class"
            ? `Class booking: ${booking.class_title || booking.booking_number || booking.id}`
            : `Service booking: ${booking.service_name || booking.package_name || booking.booking_number || booking.id}`,
          toNumber(booking.total_amount),
          getDateValue(booking, ["created_at", "event_date", "paid_at"]),
          booking.status || booking.payment_status
        )),
        ...voucherPurchases.map((voucher) => createActivity(
          `voucher-purchase-${voucher.id}`,
          "voucher",
          `Voucher purchase${voucher.voucher_code ? `: ${voucher.voucher_code}` : ""}`,
          toNumber(voucher.amount),
          getDateValue(voucher, ["created_at", "paid_at"]),
          voucher.status
        )),
        ...voucherRedemptions.map((voucher) => createActivity(
          `voucher-redemption-${voucher.id}`,
          "voucher",
          `Voucher redemption: ${voucher.voucher_code || voucher.menu_item_name || voucher.id}`,
          toNumber(voucher.menu_item_price),
          getDateValue(voucher, ["redeemed_at", "created_at", "event_date"]),
          voucher.status
        )),
        ...rentals.map((lead) => createActivity(
          `rental-${lead.id}`,
          "rental",
          `Rental inquiry: ${lead.name || lead.company || lead.email || lead.id}`,
          null,
          getDateValue(lead, ["created_at", "updated_at"]),
          lead.status
        )),
      ],
      ["date"]
    );

    return NextResponse.json({
      user,
      stats: {
        totalSpend,
        totalRevenue: totalSpend,
        orderCount: orders.length,
        totalOrders: orders.length,
        bookingCount: bookings.length,
        totalClasses: classBookings.length,
        serviceBookingCount: serviceBookings.length,
        voucherCount: vouchers.length,
        rentalInquiryCount: rentals.length,
        totalRentals: rentals.length,
        averageOrderValue,
        lifetimeValue: totalSpend,
      },
      orders,
      bookings,
      vouchers,
      rentals,
      invoices,
      activity,
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

    const referenceErrors = await clearUserReferences(supabase, id);

    if (referenceErrors.length > 0) {
      console.error("Error clearing user references:", referenceErrors);
      return NextResponse.json(
        { error: "Database error deleting user" },
        { status: 400 }
      );
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
