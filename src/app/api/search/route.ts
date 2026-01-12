import { NextRequest, NextResponse } from "next/server";
import { getClasses, getProducts, getRecipes, getBlogs } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const searchQuery = query.toLowerCase();

  try {
    const results: any[] = [];

    // Search classes
    if (type === "all" || type === "class") {
      const classes = await getClasses();
      const matchingClasses = (classes || [])
        .filter((cls: any) =>
          cls.title?.toLowerCase().includes(searchQuery) ||
          cls.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, 5)
        .map((cls: any) => ({
          id: cls._id,
          title: cls.title,
          description: cls.description,
          type: "class",
          href: `/classes/${cls.slug?.current}`,
          image: cls.mainImage ? urlFor(cls.mainImage).width(100).height(100).url() : null,
          price: cls.fullPrice,
          date: cls.startDate,
        }));
      results.push(...matchingClasses);
    }

    // Search products
    if (type === "all" || type === "product") {
      const products = await getProducts();
      const matchingProducts = (products || [])
        .filter((product: any) =>
          product.title?.toLowerCase().includes(searchQuery) ||
          product.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, 5)
        .map((product: any) => ({
          id: product._id,
          title: product.title,
          description: product.description,
          type: "product",
          href: `/products/${product.slug?.current}`,
          image: product.images?.[0] ? urlFor(product.images[0]).width(100).height(100).url() : null,
          price: product.price,
        }));
      results.push(...matchingProducts);
    }

    // Search recipes
    if (type === "all" || type === "recipe") {
      const recipes = await getRecipes();
      const matchingRecipes = (recipes || [])
        .filter((recipe: any) =>
          recipe.title?.toLowerCase().includes(searchQuery) ||
          recipe.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, 5)
        .map((recipe: any) => ({
          id: recipe._id,
          title: recipe.title,
          description: recipe.description,
          type: "recipe",
          href: `/recipes/${recipe.slug?.current}`,
          image: recipe.mainImage ? urlFor(recipe.mainImage).width(100).height(100).url() : null,
        }));
      results.push(...matchingRecipes);
    }

    // Search blogs
    if (type === "all" || type === "blog") {
      const blogs = await getBlogs();
      const matchingBlogs = (blogs || [])
        .filter((blog: any) =>
          blog.title?.toLowerCase().includes(searchQuery) ||
          blog.excerpt?.toLowerCase().includes(searchQuery)
        )
        .slice(0, 5)
        .map((blog: any) => ({
          id: blog._id,
          title: blog.title,
          description: blog.excerpt,
          type: "blog",
          href: `/blogs/${blog.slug?.current}`,
          image: blog.mainImage ? urlFor(blog.mainImage).width(100).height(100).url() : null,
        }));
      results.push(...matchingBlogs);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
