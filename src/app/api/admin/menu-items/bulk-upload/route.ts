import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      return NextResponse.json(
        { error: "File must be .xlsx, .xls, or .csv" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const errors: { row: number; message: string }[] = [];
    const toInsert: any[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // 1-indexed + header row
      const name = String(row["name"] || row["Name"] || "").trim();
      const price = parseFloat(row["price"] || row["Price"] || 0);

      if (!name) {
        errors.push({ row: rowNum, message: "Missing name" });
        return;
      }
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, message: "Invalid price" });
        return;
      }

      const rawCategories = String(row["categories"] || row["Categories"] || row["category"] || row["Category"] || "").trim();
      const categories = rawCategories
        ? rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean)
        : [];

      toInsert.push({
        name,
        description: String(row["description"] || row["Description"] || "").trim() || null,
        price,
        price_unit: String(row["price_unit"] || row["Price Unit"] || "per item").trim(),
        categories,
        image_url: String(row["image_url"] || row["Image URL"] || "").trim() || null,
        emoji: String(row["emoji"] || row["Emoji"] || "").trim() || null,
        is_active: true,
        is_popular: false,
        sort_order: 0,
        dishes: [],
        metadata: {},
      });
    });

    let inserted = 0;
    if (toInsert.length > 0) {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(toInsert)
        .select("id");

      if (error) throw error;
      inserted = data?.length || 0;
    }

    return NextResponse.json({
      inserted,
      skipped: errors.length,
      errors,
      total: rows.length,
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: error.message || "Bulk upload failed" },
      { status: 500 }
    );
  }
}
