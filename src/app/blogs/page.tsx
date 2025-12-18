import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, ArrowRight, BookOpen, Search, Clock, User, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getBlogs } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "Blog | Mamalu Kitchen - Cooking Tips, Recipes & Family Stories",
  description:
    "Discover cooking tips, healthy recipes, and inspiring culinary stories from Mamalu Kitchen. Learn how to cook with your kids and create lasting family memories.",
  keywords: ["cooking blog", "family recipes", "kids cooking", "meal prep tips", "healthy eating"],
  openGraph: {
    title: "Mamalu Kitchen Blog",
    description: "Cooking tips, recipes & family stories from our kitchen to yours.",
    type: "website",
  },
};

interface Blog {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  publishedAt: string;
  featured?: boolean;
  category?: string;
  readTime?: number;
  author?: { name: string; image?: { asset: { _ref: string } } };
}

export default async function BlogsPage() {
  const blogs: Blog[] = await getBlogs() || [];
  const featuredBlog = blogs.find(b => b.featured) || blogs[0];
  const regularBlogs = blogs.filter(b => b._id !== featuredBlog?._id);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-stone-50 via-[#ff8c6b]/5 to-stone-100 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="bg-[#ff8c6b]/10 text-[#ff8c6b] mb-4">
              <TrendingUp className="h-3 w-3 mr-1" />
              Our Blog
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Stories from <span className="text-[#ff8c6b]">Our Kitchen</span>
            </h1>
            <p className="text-lg text-stone-600 mb-8">
              Discover cooking tips, healthy recipes, and inspiring stories about 
              bringing families together through food.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                className="pl-12 h-14 rounded-full border-stone-200 focus:border-[#ff8c6b] focus:ring-[#ff8c6b] text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredBlog && (
        <section className="py-12 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold text-[#ff8c6b] uppercase tracking-wide mb-6">Featured Article</h2>
            <Link href={`/blogs/${featuredBlog.slug.current}`} className="group block">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="aspect-[16/10] lg:aspect-[4/3] bg-gradient-to-br from-[#ff8c6b]/20 to-[#ff8c6b]/30 rounded-2xl overflow-hidden relative">
                  {featuredBlog.mainImage ? (
                    <Image
                      src={urlFor(featuredBlog.mainImage).width(800).height(600).url()}
                      alt={featuredBlog.mainImage.alt || featuredBlog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-[#ff8c6b]/30" />
                    </div>
                  )}
                  <Badge className="absolute top-4 left-4 bg-[#ff8c6b] text-white">Featured</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featuredBlog.publishedAt)}
                    </span>
                    {featuredBlog.readTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredBlog.readTime} min read
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 group-hover:text-[#ff8c6b] transition-colors">
                    {featuredBlog.title}
                  </h3>
                  <p className="text-stone-600 text-lg line-clamp-3">
                    {featuredBlog.excerpt}
                  </p>
                  {featuredBlog.author && (
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-10 h-10 rounded-full bg-[#ff8c6b]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#ff8c6b]" />
                      </div>
                      <span className="font-medium text-stone-700">{featuredBlog.author.name}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="inline-flex items-center text-[#ff8c6b] font-semibold group-hover:gap-3 gap-2 transition-all">
                      Read Full Article
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-16 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Latest Articles</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-[#ff8c6b] hover:text-white hover:border-[#ff8c6b]">All</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-[#ff8c6b] hover:text-white hover:border-[#ff8c6b]">Recipes</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-[#ff8c6b] hover:text-white hover:border-[#ff8c6b]">Tips</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-[#ff8c6b] hover:text-white hover:border-[#ff8c6b] hidden sm:inline-flex">Family</Badge>
            </div>
          </div>

          {regularBlogs.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {regularBlogs.map((blog) => (
                <Card
                  key={blog._id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0"
                >
                  <Link href={`/blogs/${blog.slug.current}`}>
                    <div className="aspect-[16/10] bg-gradient-to-br from-[#ff8c6b]/20 to-[#ff8c6b]/30 flex items-center justify-center relative overflow-hidden">
                      {blog.mainImage ? (
                        <Image
                          src={urlFor(blog.mainImage).width(600).height(375).url()}
                          alt={blog.mainImage.alt || blog.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <BookOpen className="h-12 w-12 text-[#ff8c6b]/30" />
                      )}
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(blog.publishedAt)}
                        </span>
                        {blog.readTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {blog.readTime} min
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-[#ff8c6b] transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-stone-600 text-sm line-clamp-2 mb-4">
                        {blog.excerpt}
                      </p>
                      <span className="inline-flex items-center text-sm font-medium text-[#ff8c6b]">
                        Read more
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <BookOpen className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stone-700 mb-2">No articles yet</h3>
              <p className="text-stone-500">We&apos;re cooking up some great content. Check back soon!</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-r from-[#ff8c6b] to-[#e67854]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Get Cooking Tips in Your Inbox
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Subscribe for weekly recipes, meal prep ideas, and family cooking inspiration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-12 rounded-full bg-white/95 border-0 text-stone-900 placeholder:text-stone-500"
            />
            <button className="h-12 px-8 bg-stone-900 text-white rounded-full font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
