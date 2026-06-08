"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState(0);
  const isVideo = article.mediaType === "video" || article.isVideo;
  const videoUrl = article.videoUrl || (article.isVideo ? article.url : null);
  const imageUrls =
    Array.isArray(article.images) && article.images.length > 0 ? article.images : [article.image].filter(Boolean);
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
      {imageUrls.length > 1 ? (
        <button
          type="button"
          onClick={() => {
            setSelectedImage(0);
            setPreviewOpen(true);
          }}
          className="grid h-full w-full cursor-zoom-in grid-cols-2 gap-1 bg-white p-1"
          aria-label={`Preview ${article.title} images`}
        >
          {imageUrls.slice(0, 4).map((image, index) => (
            <span key={`${image}-${index}`} className="relative min-h-0 overflow-hidden rounded bg-stone-50">
              <Image src={image} alt={`${article.title} image ${index + 1}`} fill className="object-contain" />
              {index === 3 && imageUrls.length > 4 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">
                  +{imageUrls.length - 4}
                </span>
              )}
            </span>
          ))}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="relative h-full w-full cursor-zoom-in"
          aria-label={`Preview ${article.title} image`}
        >
          <Image src={imageUrls[0] || article.image} alt={article.title} fill className="object-contain" />
        </button>
      )}

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
          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSelectedImage((current) => (current - 1 + imageUrls.length) % imageUrls.length)}
                className="absolute left-4 top-1/2 z-10 rounded-full bg-white/95 p-2 text-stone-900 shadow-lg hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedImage((current) => (current + 1) % imageUrls.length)}
                className="absolute right-4 top-1/2 z-10 rounded-full bg-white/95 p-2 text-stone-900 shadow-lg hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="relative h-[86vh] w-full max-w-6xl rounded-lg bg-white shadow-2xl">
            <Image src={imageUrls[selectedImage] || imageUrls[0]} alt={article.title} fill className="object-contain p-3" />
            {imageUrls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-semibold text-white">
                {selectedImage + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
