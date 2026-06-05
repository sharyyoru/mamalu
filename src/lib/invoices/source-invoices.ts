import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseAdminClient = SupabaseClient;

export type InvoiceSourceType =
  | "service_booking"
  | "class_booking"
  | "voucher_purchase"
  | "product_order"
  | "manual";

type LineItem = {
  name: string;
  quantity?: number;
  price: number;
};

type SourceInvoiceInput = {
  sourceType: InvoiceSourceType;
  serviceBookingId?: string | null;
  classBookingId?: string | null;
  productOrderId?: string | null;
  voucherPurchaseId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  amount: number;
  baseAmount?: number | null;
  extrasAmount?: number | null;
  description?: string | null;
  lineItems?: LineItem[] | null;
  serviceName?: string | null;
  serviceType?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  status?: "draft" | "pending" | "sent" | "paid" | "cancelled" | "overdue";
  paymentLink?: string | null;
  stripeCheckoutSessionId?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  updateBookingReference?: boolean;
};

type MarkSourceInvoicePaidOptions = {
  excludeBalanceInvoices?: boolean;
};

async function generateInvoiceNumber(supabase: SupabaseAdminClient) {
  const { data } = await supabase.rpc("generate_invoice_number");
  return data || `INV-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-5)}`;
}

function getMissingColumn(message: string) {
  return message.match(/'([^']+)' column of 'invoices'/)?.[1] || null;
}

async function insertInvoiceWithAvailableColumns(
  supabase: SupabaseAdminClient,
  invoiceData: Record<string, unknown>
) {
  let dataToInsert = { ...invoiceData };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert(dataToInsert)
      .select()
      .single();

    if (!error) {
      return invoice;
    }

    const missingColumn = getMissingColumn(error.message || "");
    if (!missingColumn || !(missingColumn in dataToInsert)) {
      throw new Error(error.message || "Failed to create invoice");
    }

    console.warn(`Invoice column ${missingColumn} is not available in this database; creating invoice without it.`);
    const remainingData = { ...dataToInsert };
    delete remainingData[missingColumn];
    dataToInsert = remainingData;
  }

  throw new Error("Failed to create invoice with available columns");
}

export async function createSourceInvoice(
  supabase: SupabaseAdminClient,
  input: SourceInvoiceInput
) {
  const invoiceNumber = await generateInvoiceNumber(supabase);

  const invoiceData: Record<string, unknown> = {
    invoice_number: invoiceNumber,
    source_type: input.sourceType,
    service_booking_id: input.serviceBookingId || null,
    booking_id: input.classBookingId || null,
    product_order_id: input.productOrderId || null,
    voucher_purchase_id: input.voucherPurchaseId || null,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone || null,
    amount: input.amount,
    base_amount: input.baseAmount ?? input.amount,
    extras_amount: input.extrasAmount ?? null,
    currency: "AED",
    description: input.description || null,
    line_items: input.lineItems || null,
    service_name: input.serviceName || null,
    service_type: input.serviceType || null,
    event_date: input.eventDate || null,
    guest_count: input.guestCount || null,
    status: input.status || "pending",
    payment_link: input.paymentLink || null,
    stripe_checkout_session_id: input.stripeCheckoutSessionId || null,
    paid_at: input.paidAt || null,
    sent_at: input.paymentLink ? new Date().toISOString() : null,
    notes: input.notes || null,
    created_by: input.createdBy || null,
  };

  const invoice = await insertInvoiceWithAvailableColumns(supabase, invoiceData);

  if (input.serviceBookingId && input.updateBookingReference !== false) {
    const { error: bookingUpdateError } = await supabase
      .from("service_bookings")
      .update({ invoice_id: invoice.id, invoice_number: invoiceNumber })
      .eq("id", input.serviceBookingId);

    if (bookingUpdateError) {
      console.warn(`Could not update service booking invoice reference: ${bookingUpdateError.message}`);
    }
  }

  return invoice;
}

export async function updateSourceInvoiceCheckout(
  supabase: SupabaseAdminClient,
  source: Pick<SourceInvoiceInput, "serviceBookingId" | "classBookingId" | "voucherPurchaseId">,
  checkoutUrl: string | null,
  stripeCheckoutSessionId?: string | null,
) {
  let query = supabase.from("invoices").update({
    status: checkoutUrl ? "sent" : "pending",
    payment_link: checkoutUrl,
    stripe_checkout_session_id: stripeCheckoutSessionId || null,
    sent_at: checkoutUrl ? new Date().toISOString() : null,
  });

  if (source.serviceBookingId) query = query.eq("service_booking_id", source.serviceBookingId);
  else if (source.classBookingId) query = query.eq("booking_id", source.classBookingId);
  else if (source.voucherPurchaseId) query = query.eq("voucher_purchase_id", source.voucherPurchaseId);
  else return;

  await query;
}

export async function markSourceInvoicePaid(
  supabase: SupabaseAdminClient,
  source: Pick<SourceInvoiceInput, "serviceBookingId" | "classBookingId" | "voucherPurchaseId" | "productOrderId" | "stripeCheckoutSessionId">,
  paidAt = new Date().toISOString(),
  options: MarkSourceInvoicePaidOptions = {}
) {
  let query = supabase.from("invoices").update({
    status: "paid",
    paid_at: paidAt,
  });

  if (source.stripeCheckoutSessionId) query = query.eq("stripe_checkout_session_id", source.stripeCheckoutSessionId);
  else if (source.serviceBookingId) query = query.eq("service_booking_id", source.serviceBookingId);
  else if (source.classBookingId) query = query.eq("booking_id", source.classBookingId);
  else if (source.voucherPurchaseId) query = query.eq("voucher_purchase_id", source.voucherPurchaseId);
  else if (source.productOrderId) query = query.eq("product_order_id", source.productOrderId);
  else return;

  if (options.excludeBalanceInvoices) {
    query = query.not("description", "ilike", "%balance payment%");
  }

  await query;
}
