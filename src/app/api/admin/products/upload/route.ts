import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function extensionFromFile(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName) return fromName.toLowerCase();
  return file.type.split("/").pop() || "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const path = `products/${crypto.randomUUID()}.${extensionFromFile(file)}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);

    return NextResponse.json({
      imageUrl: data.publicUrl,
      image: {
        _type: "image",
        asset: { _ref: data.publicUrl },
      },
      asset: { url: data.publicUrl },
    });
  } catch (error: unknown) {
    console.error("Error uploading product image:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to upload product image") },
      { status: 500 }
    );
  }
}
