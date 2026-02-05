import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        const isCustomPaymentLink = session.metadata?.type === "custom_payment_link";

        if (bookingId) {
          // Update booking as paid
          await supabase
            .from("class_bookings")
            .update({
              status: "confirmed",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
              payment_method: "stripe",
            })
            .eq("id", bookingId);

          // Record transaction
          await supabase.from("payment_transactions").insert({
            booking_id: bookingId,
            transaction_type: "payment",
            payment_method: "stripe",
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || "AED",
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            metadata: {
              checkout_session_id: session.id,
              customer_email: session.customer_email,
            },
          });

          // Fetch updated booking for email
          const { data: confirmedBooking } = await supabase
            .from("class_bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

          // Send confirmation email with QR code(s)
          if (confirmedBooking && confirmedBooking.attendee_email) {
            try {
              const numberOfGuests = confirmedBooking.number_of_guests || 1;
              let guestQRs: Array<{ guestNumber: number; guestName?: string; qrToken: string }> = [];

              // Create individual guest records if multiple guests
              if (numberOfGuests > 1) {
                const guestsToInsert = [];
                for (let i = 1; i <= numberOfGuests; i++) {
                  guestsToInsert.push({
                    booking_id: bookingId,
                    guest_number: i,
                    guest_name: i === 1 ? confirmedBooking.attendee_name : `Guest ${i}`,
                  });
                }

                const { data: createdGuests } = await supabase
                  .from("booking_guests")
                  .insert(guestsToInsert)
                  .select();

                if (createdGuests) {
                  guestQRs = createdGuests.map(g => ({
                    guestNumber: g.guest_number,
                    guestName: g.guest_name,
                    qrToken: g.qr_code_token,
                  }));
                }
              }

              await sendBookingConfirmationEmail({
                bookingNumber: confirmedBooking.booking_number,
                attendeeName: confirmedBooking.attendee_name,
                attendeeEmail: confirmedBooking.attendee_email,
                classTitle: confirmedBooking.class_title,
                classDate: confirmedBooking.class_date || "TBD",
                classTime: confirmedBooking.class_time || "TBD",
                location: confirmedBooking.location || "Mamalu Kitchen",
                sessionsBooked: confirmedBooking.sessions_booked || 1,
                totalAmount: confirmedBooking.total_amount,
                numberOfGuests,
                qrToken: confirmedBooking.qr_code_token,
                guestQRs: guestQRs.length > 0 ? guestQRs : undefined,
              });

              // Mark email as sent
              await supabase
                .from("class_bookings")
                .update({ confirmation_email_sent_at: new Date().toISOString() })
                .eq("id", bookingId);

              console.log(`Confirmation email sent for booking ${confirmedBooking.booking_number} (${numberOfGuests} guests)`);
            } catch (emailError) {
              console.error("Failed to send confirmation email:", emailError);
            }
          }
        }

        // Handle custom payment link payments
        if (isCustomPaymentLink || session.payment_link) {
          const stripePaymentLinkId = session.payment_link as string;
          
          if (stripePaymentLinkId) {
            // Find and update the payment link
            const { data: paymentLink } = await supabase
              .from("payment_links")
              .select("*")
              .eq("stripe_payment_link_id", stripePaymentLinkId)
              .single();

            if (paymentLink) {
              const newUseCount = (paymentLink.use_count || 0) + 1;
              const shouldDeactivate = paymentLink.single_use || 
                (paymentLink.max_uses && newUseCount >= paymentLink.max_uses);

              // Generate QR code token for payment link
              const qrCodeToken = crypto.randomUUID();

              await supabase
                .from("payment_links")
                .update({
                  status: shouldDeactivate ? "paid" : "active",
                  paid_at: new Date().toISOString(),
                  paid_amount: (session.amount_total || 0) / 100,
                  use_count: newUseCount,
                  customer_email: session.customer_email || undefined,
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id: session.payment_intent as string,
                  qr_code_token: qrCodeToken,
                })
                .eq("id", paymentLink.id);

              // Update associated service_booking if exists
              if (paymentLink.reference_type === "service_booking" && paymentLink.reference_id) {
                const { data: booking } = await supabase
                  .from("service_bookings")
                  .select("is_deposit_payment, deposit_amount, total_amount")
                  .eq("id", paymentLink.reference_id)
                  .single();

                if (booking) {
                  const paidAmount = (session.amount_total || 0) / 100;
                  const isDepositPayment = booking.is_deposit_payment;
                  const isFullPayment = !isDepositPayment || paidAmount >= booking.total_amount;

                  await supabase
                    .from("service_bookings")
                    .update({
                      payment_status: isFullPayment ? "paid" : "deposit_paid",
                      deposit_paid: isDepositPayment ? true : undefined,
                      paid_at: new Date().toISOString(),
                      status: "confirmed",
                    })
                    .eq("id", paymentLink.reference_id);

                  console.log(`Updated service_booking ${paymentLink.reference_id} payment status`);
                }
              }

              // Update associated invoice if exists
              const { data: invoice } = await supabase
                .from("invoices")
                .select("id")
                .eq("payment_link_id", paymentLink.id)
                .single();

              if (invoice) {
                await supabase
                  .from("invoices")
                  .update({
                    status: "paid",
                    paid_at: new Date().toISOString(),
                  })
                  .eq("id", invoice.id);

                console.log(`Updated invoice ${invoice.id} to paid status`);
              }

              // Record transaction
              await supabase.from("payment_transactions").insert({
                transaction_type: "payment",
                payment_method: "stripe",
                amount: (session.amount_total || 0) / 100,
                currency: session.currency?.toUpperCase() || "AED",
                status: "completed",
                stripe_payment_intent_id: session.payment_intent as string,
                metadata: {
                  checkout_session_id: session.id,
                  payment_link_id: paymentLink.id,
                  stripe_payment_link_id: stripePaymentLinkId,
                  customer_email: session.customer_email,
                  service_booking_id: paymentLink.reference_type === "service_booking" ? paymentLink.reference_id : undefined,
                },
              });

              // Send confirmation email with QR codes
              const customerEmail = session.customer_email || paymentLink.customer_email;
              const numberOfPeople = paymentLink.number_of_people || 1;

              if (customerEmail) {
                try {
                  let guestQRs: Array<{ guestNumber: number; guestName?: string; qrToken: string }> = [];

                  // Create individual guest records if multiple people
                  if (numberOfPeople > 1) {
                    const guestsToInsert = [];
                    for (let i = 1; i <= numberOfPeople; i++) {
                      guestsToInsert.push({
                        payment_link_id: paymentLink.id,
                        guest_number: i,
                        guest_name: i === 1 ? (paymentLink.customer_name || "Guest 1") : `Guest ${i}`,
                      });
                    }

                    const { data: createdGuests } = await supabase
                      .from("payment_link_guests")
                      .insert(guestsToInsert)
                      .select();

                    if (createdGuests) {
                      guestQRs = createdGuests.map(g => ({
                        guestNumber: g.guest_number,
                        guestName: g.guest_name,
                        qrToken: g.qr_code_token,
                      }));
                    }
                  }

                  await sendBookingConfirmationEmail({
                    bookingNumber: paymentLink.link_code,
                    attendeeName: paymentLink.customer_name || "Guest",
                    attendeeEmail: customerEmail,
                    classTitle: paymentLink.title,
                    classDate: "See confirmation details",
                    classTime: "See confirmation details",
                    location: "Mamalu Kitchen",
                    sessionsBooked: 1,
                    totalAmount: (session.amount_total || 0) / 100,
                    numberOfGuests: numberOfPeople,
                    qrToken: qrCodeToken,
                    guestQRs: guestQRs.length > 0 ? guestQRs : undefined,
                  });

                  // Mark email as sent
                  await supabase
                    .from("payment_links")
                    .update({ confirmation_email_sent_at: new Date().toISOString() })
                    .eq("id", paymentLink.id);

                  console.log(`Payment link confirmation email sent to ${customerEmail} (${numberOfPeople} people)`);
                } catch (emailError) {
                  console.error("Failed to send payment link confirmation email:", emailError);
                }
              }
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          // Mark checkout as expired but don't cancel booking
          await supabase
            .from("class_bookings")
            .update({
              stripe_checkout_session_id: null,
            })
            .eq("id", bookingId)
            .eq("stripe_checkout_session_id", session.id);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update any booking with this payment intent
        await supabase
          .from("class_bookings")
          .update({
            status: "confirmed",
            paid_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .is("paid_at", null);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Record failed transaction
        await supabase.from("payment_transactions").insert({
          transaction_type: "payment",
          payment_method: "stripe",
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: "failed",
          stripe_payment_intent_id: paymentIntent.id,
          metadata: {
            error: paymentIntent.last_payment_error?.message,
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const bookingId = invoice.metadata?.booking_id;

        if (bookingId) {
          await supabase
            .from("class_bookings")
            .update({
              status: "confirmed",
              paid_at: new Date().toISOString(),
              stripe_invoice_id: invoice.id,
            })
            .eq("id", bookingId);
        }

        // Update invoice record if exists
        const { data: invoiceRecord } = await supabase
          .from("invoices")
          .select("id")
          .eq("stripe_invoice_id", invoice.id)
          .single();

        if (invoiceRecord) {
          await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", invoiceRecord.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        
        // Find booking by payment intent
        const { data: booking } = await supabase
          .from("class_bookings")
          .select("id, total_amount")
          .eq("stripe_payment_intent_id", charge.payment_intent)
          .single();

        if (booking) {
          const refundAmount = charge.amount_refunded / 100;
          
          await supabase
            .from("class_bookings")
            .update({
              refund_amount: refundAmount,
              refunded_at: new Date().toISOString(),
              status: refundAmount >= booking.total_amount ? "cancelled" : "confirmed",
            })
            .eq("id", booking.id);

          // Record refund transaction
          await supabase.from("payment_transactions").insert({
            booking_id: booking.id,
            transaction_type: refundAmount >= booking.total_amount ? "refund" : "partial_refund",
            payment_method: "stripe",
            amount: refundAmount,
            currency: charge.currency.toUpperCase(),
            status: "completed",
            stripe_charge_id: charge.id,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
