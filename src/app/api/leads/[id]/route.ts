import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RevenueRow {
  payment_status?: string | null;
  amount?: string | number | null;
  total_amount?: string | number | null;
}

interface LeadPaymentLink {
  id: string;
  invoice_id?: string | null;
  status?: string | null;
  paid_at?: string | null;
  stripe_payment_link_url?: string | null;
}

const parseAmount = (value: string | number | null | undefined) => {
  return typeof value === "number" ? value : parseFloat(value || "0") || 0;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

// GET single lead with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    // Fetch lead with assigned user details
    const { data: fetchedLead, error: leadError } = await supabase
      .from("leads")
      .select(`
        *,
        assigned_user:assigned_to(id, full_name, email)
      `)
      .eq("id", id)
      .single();

    if (leadError) throw leadError;
    let lead = fetchedLead;

    // Fetch lead's manual bookings
    const { data: leadBookings } = await supabase
      .from("lead_bookings")
      .select("*")
      .eq("lead_id", id)
      .order("event_date", { ascending: false });

    // Fetch service bookings linked to this lead
    const { data: serviceBookings } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    // Fetch invoices linked to this lead, including invoices attached through payment links.
    const invoiceById = new Map<string, Record<string, unknown>>();
    const addInvoices = (rows: Record<string, unknown>[] | null | undefined) => {
      (rows || []).forEach((invoice) => {
        if (typeof invoice.id === "string") {
          invoiceById.set(invoice.id, invoice);
        }
      });
    };

    const { data: directInvoices, error: directInvoicesError } = await supabase
      .from("invoices")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    if (directInvoicesError) {
      console.warn(`Lead invoice direct lookup failed: ${directInvoicesError.message}`);
    } else {
      addInvoices(directInvoices as Record<string, unknown>[]);
    }

    let leadPaymentLinks: LeadPaymentLink[] = [];
    const { data: paymentLinksWithInvoices, error: paymentLinksWithInvoicesError } = await supabase
      .from("payment_links")
      .select("id, invoice_id, status, paid_at, stripe_payment_link_url")
      .eq("lead_id", id);

    if (paymentLinksWithInvoicesError) {
      const { data: paymentLinksOnly, error: paymentLinksOnlyError } = await supabase
        .from("payment_links")
        .select("id, status, paid_at, stripe_payment_link_url")
        .eq("lead_id", id);

      if (paymentLinksOnlyError) {
        console.warn(`Lead payment link lookup failed: ${paymentLinksOnlyError.message}`);
      } else {
        leadPaymentLinks = (paymentLinksOnly || []) as LeadPaymentLink[];
      }
    } else {
      leadPaymentLinks = (paymentLinksWithInvoices || []) as LeadPaymentLink[];
    }

    const hasPaidPaymentLink = leadPaymentLinks.some((link) => link.status === "paid" || Boolean(link.paid_at));

    if (hasPaidPaymentLink && lead.status !== "won") {
      const { data: updatedLead, error: updateLeadStatusError } = await supabase
        .from("leads")
        .update({
          status: "won",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
          *,
          assigned_user:assigned_to(id, full_name, email)
        `)
        .single();

      if (updateLeadStatusError) {
        console.warn(`Lead paid status reconciliation failed: ${updateLeadStatusError.message}`);
        lead = { ...lead, status: "won" };
      } else {
        lead = updatedLead;
      }
    }

    const linkedInvoiceIds = [
      ...new Set(
        leadPaymentLinks
          .map((link) => link.invoice_id)
          .filter((invoiceId): invoiceId is string => Boolean(invoiceId))
      ),
    ];
    const leadPaymentLinkIds = leadPaymentLinks.map((link) => link.id).filter(Boolean);

    if (linkedInvoiceIds.length > 0) {
      const { data: invoicesById, error: invoicesByIdError } = await supabase
        .from("invoices")
        .select("*")
        .in("id", linkedInvoiceIds);

      if (invoicesByIdError) {
        console.warn(`Lead invoice id lookup failed: ${invoicesByIdError.message}`);
      } else {
        addInvoices(invoicesById as Record<string, unknown>[]);
      }
    }

    if (leadPaymentLinkIds.length > 0) {
      const { data: invoicesByPaymentLink, error: invoicesByPaymentLinkError } = await supabase
        .from("invoices")
        .select("*")
        .in("payment_link_id", leadPaymentLinkIds);

      if (invoicesByPaymentLinkError) {
        console.warn(`Lead payment-link invoice lookup failed: ${invoicesByPaymentLinkError.message}`);
      } else {
        addInvoices(invoicesByPaymentLink as Record<string, unknown>[]);
      }
    }

    const paidPaymentLinkByInvoiceId = new Map(
      leadPaymentLinks
        .filter((link) => Boolean(link.invoice_id) && (link.status === "paid" || Boolean(link.paid_at)))
        .map((link) => [link.invoice_id as string, link])
    );
    const paidPaymentLinkByUrl = new Map(
      leadPaymentLinks
        .filter((link) => Boolean(link.stripe_payment_link_url) && (link.status === "paid" || Boolean(link.paid_at)))
        .map((link) => [link.stripe_payment_link_url as string, link])
    );

    const invoices = Array.from(invoiceById.values()).map((invoice) => {
      const invoiceId = typeof invoice.id === "string" ? invoice.id : "";
      const invoicePaymentUrl = typeof invoice.payment_link === "string" ? invoice.payment_link : "";
      const paidLink = paidPaymentLinkByInvoiceId.get(invoiceId) || paidPaymentLinkByUrl.get(invoicePaymentUrl);

      if (!paidLink || invoice.status === "paid") return invoice;

      return {
        ...invoice,
        status: "paid",
        paid_at: paidLink.paid_at || invoice.paid_at || null,
      };
    }).sort((a, b) => {
      const aCreatedAt = typeof a.created_at === "string" ? a.created_at : "";
      const bCreatedAt = typeof b.created_at === "string" ? b.created_at : "";
      return bCreatedAt.localeCompare(aCreatedAt);
    });

    // Calculate total revenue
    const manualRevenue = ((leadBookings || []) as RevenueRow[])
      .filter((booking) => booking.payment_status === "paid")
      .reduce((sum, booking) => sum + parseAmount(booking.amount), 0);

    const bookingRevenue = ((serviceBookings || []) as RevenueRow[])
      .filter((booking) => booking.payment_status === "paid" || booking.payment_status === "deposit_paid")
      .reduce((sum, booking) => sum + parseAmount(booking.total_amount), 0);

    const totalRevenue = manualRevenue + bookingRevenue;

    return NextResponse.json({
      lead,
      leadBookings: leadBookings || [],
      serviceBookings: serviceBookings || [],
      invoices: invoices || [],
      stats: {
        totalRevenue,
        manualRevenue,
        bookingRevenue,
        totalBookings: (leadBookings?.length || 0) + (serviceBookings?.length || 0),
        totalInvoices: invoices?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to fetch lead") },
      { status: 500 }
    );
  }
}

// PUT update lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");
    
    const updateData = (await request.json()) as Record<string, unknown>;
    delete updateData.assigned_user; // Remove nested objects

    const { data, error } = await supabase
      .from("leads")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to update lead") },
      { status: 500 }
    );
  }
}

// DELETE lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    // Delete associated lead_bookings first
    await supabase.from("lead_bookings").delete().eq("lead_id", id);

    // Delete the lead
    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to delete lead") },
      { status: 500 }
    );
  }
}
