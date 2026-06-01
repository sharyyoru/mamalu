import { NextRequest, NextResponse } from "next/server";
import { createSanityAdminClient } from "@/lib/sanity/admin";

function createKey() {
  return Math.random().toString(36).slice(2, 12);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const client = createSanityAdminClient();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: file.name,
      contentType: file.type || undefined,
    });

    return NextResponse.json({
      image: {
        _key: createKey(),
        _type: "image",
        asset: {
          _type: "reference",
          _ref: asset._id,
        },
      },
      asset,
    });
  } catch (error: unknown) {
    console.error("Error uploading product image:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to upload product image") },
      { status: 500 }
    );
  }
}
