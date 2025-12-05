import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
// import { getBlogBySlug, getBlogs } from "@/lib/sanity/queries";
// import { urlFor } from "@/lib/sanity/client";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

// Placeholder data
const blogsData: Record<string, {
  _id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  author: { name: string };
  body: string;
}> = {
  "art-of-perfect-hummus": {
    _id: "1",
    title: "The Art of Perfect Hummus",
    excerpt:
      "Learn the secrets to creating silky smooth hummus that rivals the best Middle Eastern restaurants.",
    publishedAt: "2024-01-15",
    author: { name: "Chef Ahmad" },
    body: "Hummus is more than just a dip—it's a culinary art form that has been perfected over centuries. The secret lies in the quality of your chickpeas, the freshness of your tahini, and the technique of blending.\n\nStart with dried chickpeas, soaked overnight and cooked until they're incredibly soft. The skins should slip off easily. Use high-quality tahini and fresh lemon juice. Blend while the chickpeas are still warm for the smoothest texture.\n\nDon't forget the ice water—it's the secret ingredient that makes professional hummus so light and fluffy. Add it slowly while blending until you achieve that perfect, cloud-like consistency.",
  },
};

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = blogsData[slug];

  if (!blog) {
    return { title: "Blog Not Found" };
  }

  return {
    title: blog.title,
    description: blog.excerpt,
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const blog = blogsData[slug];

  if (!blog) {
    notFound();
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild href="/blogs" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
            {blog.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-stone-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(blog.publishedAt)}
            </div>
            {blog.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {blog.author.name}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Featured Image Placeholder */}
          <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center mb-8">
            <BookOpen className="h-20 w-20 text-amber-600/30" />
          </div>

          {/* Article Body */}
          <article className="prose prose-stone prose-lg max-w-none">
            {blog.body.split("\n\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}
