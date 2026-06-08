"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { PressArticle } from "@/types/press";

function getYoutubeEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname.startsWith("/embed/")) return url;
      const id = parsedUrl.searchParams.get("v") || parsedUrl.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function PressMediaPreview({ article }: { article: PressArticle }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isVideo = article.mediaType === "video" || article.isVideo;
  const videoUrl = article.videoUrl || (article.isVideo ? article.url : null);
  const youtubeEmbedUrl =
    isVideo && videoUrl && (article.videoSource === "youtube" || videoUrl.includes("youtu"))
      ? getYoutubeEmbedUrl(videoUrl)
      : null;

  if (isVideo && youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        title={article.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (isVideo && videoUrl) {
    return (
      <video
        src={videoUrl}
        poster={article.image || undefined}
        controls
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="relative h-full w-full cursor-zoom-in"
        aria-label={`Preview ${article.title} image`}
      >
        <Image src={article.image} alt={article.title} fill className="object-contain" />
      </button>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/95 p-2 text-stone-900 shadow-lg hover:bg-white"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute inset-0 -z-10"
            aria-label="Close image preview"
          />
          <div className="relative h-[86vh] w-full max-w-6xl rounded-lg bg-white shadow-2xl">
            <Image src={article.image} alt={article.title} fill className="object-contain p-3" />
          </div>
        </div>
      )}
    </>
  );
}
