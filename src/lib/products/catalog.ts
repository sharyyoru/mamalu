import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductCategoryRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

export type ProductRow = {
  id: string;
  created_at?: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number | string | null;
  compare_at_price: number | string | null;
  image_url: string | null;
  category_ids: string[] | null;
  tags: string[] | null;
  in_stock: boolean | null;
  is_active: boolean | null;
  stock_quantity: number | null;
  sku: string | null;
  weight: number | string | null;
  featured: boolean | null;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function currentSlug(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "current" in value) {
    return String((value as { current?: unknown }).current || "");
  }
  return "";
}

export function mapCategory(row: ProductCategoryRow) {
  return {
    _id: row.id,
    title: row.title,
    slug: { current: row.slug },
    description: row.description || "",
    order: row.display_order || 0,
    isActive: row.is_active !== false,
  };
}

export function mapProduct(row: ProductRow, categoryMap = new Map<string, ProductCategoryRow>()) {
  const imageUrl = row.image_url || "";
  return {
    _id: row.id,
    _createdAt: row.created_at,
    title: row.title,
    slug: { current: row.slug },
    description: row.description || "",
    price: Number(row.price || 0),
    compareAtPrice: row.compare_at_price == null ? undefined : Number(row.compare_at_price),
    images: imageUrl
      ? [{ _type: "image", asset: { _ref: imageUrl }, alt: row.title }]
      : [],
    imageUrl,
    previewImageUrl: imageUrl,
    categories: (row.category_ids || [])
      .map((id) => categoryMap.get(id))
      .filter((category): category is ProductCategoryRow => Boolean(category))
      .map(mapCategory),
    tags: row.tags || [],
    inStock: row.in_stock !== false,
    isActive: row.is_active !== false,
    stockQuantity: row.stock_quantity ?? undefined,
    sku: row.sku || "",
    weight: row.weight == null ? undefined : Number(row.weight),
    featured: row.featured === true,
  };
}

export async function fetchProductCategories(
  supabase: SupabaseClient,
  options: { activeOnly?: boolean } = {}
) {
  let query = supabase
    .from("product_categories")
    .select("id,title,slug,description,display_order,is_active")
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as ProductCategoryRow[];
}

export async function fetchProducts(
  supabase: SupabaseClient,
  options: { activeOnly?: boolean; ids?: string[] } = {}
) {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  if (options.ids?.length) {
    query = query.in("id", options.ids);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as ProductRow[];
}
