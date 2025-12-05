import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Newspaper } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getPressArticles } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "Press",
  description:
    "Read about Mamalu Kitchen in the news. Media coverage, features, and press releases.",
};

interface PressArticle {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  source: string;
  externalUrl?: string;
  publishedAt: string;
}

export default async function PressPage() {
  const pressArticles: PressArticle[] = await getPressArticles() || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Press & Media
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              See what the media is saying about Mamalu Kitchen.
            </p>
          </div>
        </div>
      </section>

      {/* Press Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {pressArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pressArticles.map((article) => (
                <Card
                  key={article._id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center relative overflow-hidden">
                    {article.mainImage ? (
                      <Image
                        src={urlFor(article.mainImage).width(600).height(340).url()}
                        alt={article.mainImage.alt || article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Newspaper className="h-12 w-12 text-stone-400" />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{article.source}</Badge>
                      <span className="text-sm text-stone-500">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    {article.externalUrl && (
                      <a
                        href={article.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                      >
                        Read article
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No press articles yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Media Inquiries */}
      <section className="py-16 bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">
            Media Inquiries
          </h2>
          <p className="text-stone-600 mb-6">
            For press inquiries, interview requests, or media kit access, please
            contact our communications team.
          </p>
          <a
            href="mailto:press@mamalukitchen.com"
            className="inline-flex items-center text-amber-600 font-medium hover:text-amber-700"
          >
            press@mamalukitchen.com
          </a>
        </div>
      </section>
    </div>
  );
}
