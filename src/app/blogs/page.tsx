import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getBlogs } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles, cooking tips, and culinary insights from Mamalu Kitchen.",
};

interface Blog {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  publishedAt: string;
  featured?: boolean;
  author?: { name: string; image?: { asset: { _ref: string } } };
}

export default async function BlogsPage() {
  const blogs: Blog[] = await getBlogs() || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Our Blog
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Discover cooking tips, recipes insights, and culinary stories from
              our kitchen to yours.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {blogs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Card
                  key={blog._id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                    {blog.mainImage ? (
                      <Image
                        src={urlFor(blog.mainImage).width(600).height(340).url()}
                        alt={blog.mainImage.alt || blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-amber-600/30" />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
                      <Calendar className="h-4 w-4" />
                      {formatDate(blog.publishedAt)}
                      {blog.author && (
                        <>
                          <span>•</span>
                          <span>{blog.author.name}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                      {blog.excerpt}
                    </p>
                    <Link
                      href={`/blogs/${blog.slug.current}`}
                      className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      Read more
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No blog posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
