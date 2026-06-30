import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

type SourceType = "service_booking" | "product_order";

type CreditNoteLineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const getCreditAmounts = (total: number) => {
  const subtotal = roundMoney(total / 1.05);
  const vat = roundMoney(total - subtotal);
  return { subtotal, vat, total: roundMoney(total) };
};

const normalizeNumber = (value: unknown) => {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const normalizeBookingLineItems = (booking: any): CreditNoteLineItem[] => {
  const items = Array.isArray(booking.items) ? booking.items : [];
  const extras = Array.isArray(booking.extras) ? booking.extras : [];
  const lineItems: CreditNoteLineItem[] = [];

  if (items.length > 0) {
    items.forEach((item: any) => {
      const quantity = normalizeNumber(item.quantity || 1) || 1;
      const amount = normalizeNumber(item.price || item.amount || item.total || 0) * quantity;
      lineItems.push({
        description: item.name || item.title || booking.menu_name || booking.service_name,
        quantity,
        rate: roundMoney(amount / quantity),
        amount: roundMoney(amount),
      });
    });
  } else {
    lineItems.push({
      description: [booking.service_name, booking.menu_name || booking.package_name].filter(Boolean).join(" - "),
      quantity: 1,
      rate: roundMoney(normalizeNumber(booking.base_amount || booking.total_amount) - normalizeNumber(booking.extras_amount)),
      amount: roundMoney(normalizeNumber(booking.base_amount || booking.total_amount) - normalizeNumber(booking.extras_amount)),
    });
  }

  extras.forEach((extra: any) => {
    const quantity = normalizeNumber(extra.quantity || 1) || 1;
    const rate = normalizeNumber(extra.price || extra.amount || 0);
    lineItems.push({
      description: extra.name || extra.title || "Extra",
      quantity,
      rate: roundMoney(rate),
      amount: roundMoney(rate * quantity),
    });
  });

  return lineItems.filter((item) => item.amount > 0);
};

const normalizeOrderLineItems = (order: any): CreditNoteLineItem[] => {
  const items = Array.isArray(order.items) ? order.items : [];
  const lineItems: CreditNoteLineItem[] = items.map((item: any) => {
    const quantity = normalizeNumber(item.quantity || 1) || 1;
    const rate = normalizeNumber(item.price || item.unit_price || 0);
    return {
      description: item.title || item.name || "Product",
      quantity,
      rate: roundMoney(rate),
      amount: roundMoney(rate * quantity),
    };
  });

  const shippingCost = normalizeNumber(order.shipping_cost);
  if (shippingCost > 0) {
    lineItems.push({
      description: "Shipping",
      quantity: 1,
      rate: roundMoney(shippingCost),
      amount: roundMoney(shippingCost),
    });
  }

  return lineItems.filter((item) => item.amount > 0);
};

async function generateCreditNoteNumber(supabase: ReturnType<typeof createAdminClient>) {
  if (!supabase) return `TCN-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-4)}`;
  const { data } = await supabase.rpc("generate_credit_note_number");
  return data || `TCN-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-4)}`;
}

async function findOriginalInvoiceNumber(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  sourceType: SourceType,
  sourceId: string,
  sourceInvoiceNumber?: string | null
) {
  if (sourceInvoiceNumber) return sourceInvoiceNumber;

  const column = sourceType === "service_booking" ? "service_booking_id" : "product_order_id";
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq(column, sourceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data?.invoice_number) return data.invoice_number;

  if (sourceType === "service_booking") {
    const { data: booking } = await supabase
      .from("service_bookings")
      .select("invoice_number, invoice_id")
      .eq("id", sourceId)
      .maybeSingle();

    if (booking?.invoice_number) return booking.invoice_number;

    if (booking?.invoice_id) {
      const { data: invoiceById } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("id", booking.invoice_id)
        .maybeSingle();

      return invoiceById?.invoice_number || null;
    }
  }

  return null;
}

async function withOriginalInvoiceNumbers(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  creditNotes: any[]
) {
  return Promise.all(
    creditNotes.map(async (note) => {
      if (note.original_invoice_number) return note;
      const originalInvoiceNumber = await findOriginalInvoiceNumber(
        supabase,
        note.source_type,
        note.source_id,
        null
      );
      return { ...note, original_invoice_number: originalInvoiceNumber };
    })
  );
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ["staff", "admin", "super_admin", "accountant"]);
    if (authResult instanceof NextResponse) return authResult;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType");
    const sourceId = searchParams.get("sourceId");

    let query = supabase.from("credit_notes").select("*").order("created_at", { ascending: false });
    if (sourceType) query = query.eq("source_type", sourceType);
    if (sourceId) query = query.eq("source_id", sourceId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const creditNotes = await withOriginalInvoiceNumbers(supabase, data || []);
    return NextResponse.json({ creditNotes });
  } catch (error) {
    console.error("Fetch credit notes error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch credit notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ["staff", "admin", "super_admin", "accountant"]);
    if (authResult instanceof NextResponse) return authResult;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { sourceType, sourceId } = await request.json();
    if (!["service_booking", "product_order"].includes(sourceType) || !sourceId) {
      return NextResponse.json({ error: "Valid sourceType and sourceId are required" }, { status: 400 });
    }

    const typedSourceType = sourceType as SourceType;
    const { data: existing, error: existingError } = await supabase
      .from("credit_notes")
      .select("*")
      .eq("source_type", typedSourceType)
      .eq("source_id", sourceId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (existing) {
      await supabase.from("credit_notes").update({ downloaded_at: new Date().toISOString() }).eq("id", existing.id);
      const originalInvoiceNumber = await findOriginalInvoiceNumber(
        supabase,
        typedSourceType,
        sourceId,
        existing.original_invoice_number
      );
      return NextResponse.json({
        creditNote: { ...existing, original_invoice_number: originalInvoiceNumber },
        existing: true,
      });
    }

    let source: any = null;
    let lineItems: CreditNoteLineItem[] = [];
    if (typedSourceType === "service_booking") {
      const { data, error } = await supabase.from("service_bookings").select("*").eq("id", sourceId).single();
      if (error || !data) return NextResponse.json({ error: error?.message || "Booking not found" }, { status: 404 });
      source = data;
      const total = normalizeNumber(source.total_amount);
      const fullyPaid = Boolean(source.paid_at || source.payment_status === "fully_paid" || (source.is_deposit_payment && source.deposit_paid && source.balance_paid));
      if (!fullyPaid || total <= 0 || source.status === "cancelled" || source.is_voucher_redemption) {
        return NextResponse.json({ error: "Booking is not eligible for a tax credit note" }, { status: 400 });
      }
      lineItems = normalizeBookingLineItems(source);
    } else {
      const { data, error } = await supabase.from("product_orders").select("*").eq("id", sourceId).single();
      if (error || !data) return NextResponse.json({ error: error?.message || "Order not found" }, { status: 404 });
      source = data;
      const total = normalizeNumber(source.total_amount);
      if (source.payment_status !== "paid" || total <= 0) {
        return NextResponse.json({ error: "Order is not eligible for a tax credit note" }, { status: 400 });
      }
      lineItems = normalizeOrderLineItems(source);
    }

    const total = normalizeNumber(source.total_amount);
    const amounts = getCreditAmounts(total);
    const creditNoteNumber = await generateCreditNoteNumber(supabase);
    const sourceReference = typedSourceType === "service_booking" ? source.booking_number : source.order_number;
    const originalInvoiceNumber = await findOriginalInvoiceNumber(
      supabase,
      typedSourceType,
      sourceId,
      typedSourceType === "service_booking" ? source.invoice_number : source.invoice_number
    );

    const { data: creditNote, error: insertError } = await supabase
      .from("credit_notes")
      .insert({
        credit_note_number: creditNoteNumber,
        source_type: typedSourceType,
        source_id: sourceId,
        customer_name: source.customer_name,
        customer_email: source.customer_email,
        customer_phone: source.customer_phone || null,
        source_reference: sourceReference,
        original_invoice_number: originalInvoiceNumber,
        line_items: lineItems.length > 0 ? lineItems : [{ description: sourceReference, quantity: 1, rate: amounts.total, amount: amounts.total }],
        subtotal_amount: amounts.subtotal,
        vat_amount: amounts.vat,
        total_credit_amount: amounts.total,
        created_by: authResult.user.id,
        downloaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: duplicate } = await supabase
          .from("credit_notes")
          .select("*")
          .eq("source_type", typedSourceType)
          .eq("source_id", sourceId)
          .single();
        const duplicateInvoiceNumber = await findOriginalInvoiceNumber(
          supabase,
          typedSourceType,
          sourceId,
          duplicate?.original_invoice_number
        );
        return NextResponse.json({
          creditNote: duplicate ? { ...duplicate, original_invoice_number: duplicateInvoiceNumber } : duplicate,
          existing: true,
        });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ creditNote, existing: false });
  } catch (error) {
    console.error("Create credit note error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create credit note" }, { status: 500 });
  }
}
