"use client";

import { useEffect, useState } from "react";
import { Heart, RefreshCw, ImageIcon } from "lucide-react";
import { API_BASE } from "@/lib/api";

type MediaItem = {
  id: string;
  filename: string;
  caption: string;
  guestName: string;
  mimeType: string;
  uploadedAt: string;
};

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upload`);
      const data = await res.json();
      setMedia(data.media || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const interval = setInterval(fetchMedia, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-rose-400" />
            <h1 className="font-serif text-3xl text-stone-800">Gallery</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-stone-400 hover:text-stone-600">
              Home
            </a>
            <span className="text-stone-300">|</span>
            <a href="/upload" className="text-sm text-stone-400 hover:text-stone-600">
              Upload
            </a>
            <span className="text-stone-300">|</span>
            <a href="/slideshow" className="text-sm text-stone-400 hover:text-stone-600">
              Slideshow
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-stone-500">
            {loading
              ? "Loading..."
              : `${media.length} ${media.length === 1 ? "photo" : "photos"} shared`}
          </p>
          <button
            onClick={fetchMedia}
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-3 border-rose-200 border-t-rose-500 animate-spin" />
          </div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-stone-300" />
            </div>
            <p className="font-serif text-2xl text-stone-700 mb-2">
              No photos yet
            </p>
            <p className="text-sm text-stone-400 mb-6">
              Be the first to share a moment
            </p>
            <a
              href="/upload"
              className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
            >
              Upload a Photo
            </a>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => setLightbox(item)}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                {isVideo(item.mimeType) ? (
                  <video
                    src={`${API_BASE}/uploads/${item.filename}`}
                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={`${API_BASE}/uploads/${item.filename}`}
                    alt={item.caption || item.guestName || "Wedding photo"}
                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  {item.caption && (
                    <p className="text-white text-sm font-medium">
                      {item.caption}
                    </p>
                  )}
                  {item.guestName && (
                    <p className="text-white/70 text-xs absolute top-2 right-2">
                      {item.guestName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
            {isVideo(lightbox.mimeType) ? (
              <video
                src={`${API_BASE}/uploads/${lightbox.filename}`}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            ) : (
              <img
                src={`${API_BASE}/uploads/${lightbox.filename}`}
                alt={lightbox.caption || "Wedding photo"}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            {lightbox.caption && (
              <p className="text-white text-center mt-4 font-serif text-lg">
                {lightbox.caption}
              </p>
            )}
            {lightbox.guestName && (
              <p className="text-white/50 text-sm mt-1">
                — {lightbox.guestName}
              </p>
            )}
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
