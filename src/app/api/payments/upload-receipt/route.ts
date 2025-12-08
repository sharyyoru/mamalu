import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const bookingId = formData.get("bookingId") as string;
    const file = formData.get("receipt") as File;

    if (!bookingId || !file) {
      return NextResponse.json(
        { error: "Booking ID and receipt file are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.paid_at && booking.receipt_verified) {
      return NextResponse.json(
        { error: "Booking already paid and verified" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${booking.booking_number}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cash-receipts")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload receipt" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("cash-receipts")
      .getPublicUrl(fileName);

    const receiptUrl = urlData.publicUrl;

    // Update booking with receipt info
    const { error: updateError } = await supabase
      .from("class_bookings")
      .update({
        payment_method: "cash",
        receipt_url: receiptUrl,
        receipt_uploaded_at: new Date().toISOString(),
        receipt_verified: false,
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      receiptUrl,
      message: "Receipt uploaded successfully. Awaiting verification.",
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload receipt" },
      { status: 500 }
    );
  }
}
