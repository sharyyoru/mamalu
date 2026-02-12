import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST upload menu item image
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const menuItemId = formData.get("menuItemId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${menuItemId || "temp"}-${Date.now()}.${ext}`;
    const filePath = `menu/${filename}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // If menuItemId provided, update the menu item
    if (menuItemId) {
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq("id", menuItemId);

      if (updateError) {
        console.error("Error updating menu item with image:", updateError);
      }
    }

    return NextResponse.json({ url: imageUrl, path: filePath });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
