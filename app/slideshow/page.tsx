"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { API_BASE } from "@/lib/api";

type MediaItem = {
  id: string;
  filename: string;
  caption: string;
  guestName: string;
  mimeType: string;
  uploadedAt: string;
};

export default function SlideshowPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upload`);
      const data = await res.json();
      if (data.media && data.media.length > 0) {
        setMedia(data.media);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchMedia();
    const pollInterval = setInterval(fetchMedia, 20000);
    return () => clearInterval(pollInterval);
  }, [fetchMedia]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (media.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [media.length]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) {
          document.exitFullscreen?.();
          setFullscreen(false);
        } else {
          window.location.href = "/";
        }
      } else if (e.key === "ArrowRight" && media.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      } else if (e.key === "ArrowLeft" && media.length > 0) {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [media.length, fullscreen]);

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const current = media[currentIndex];
  const isVideo = current?.mimeType?.startsWith("video/");

  return (
    <main className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <a href="/" className="text-white/70 hover:text-white text-sm">
          ← Exit
        </a>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm">
            {media.length > 0
              ? `${currentIndex + 1} / ${media.length}`
              : "Loading..."}
          </span>
          <button
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white text-sm border border-white/20 rounded px-3 py-1"
          >
            {fullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
          </button>
        </div>
      </div>

      {/* Content */}
      {media.length === 0 ? (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-white/10 border-t-white/40 animate-spin mb-6" />
          <p className="font-serif text-3xl text-white/80">
            Waiting for photos...
          </p>
          <p className="text-white/40 mt-2">
            Photos will appear here automatically as guests upload them
          </p>
        </div>
      ) : (
        <div
          key={current.id}
          className="slideshow-fade w-full h-full flex items-center justify-center p-8"
        >
          {isVideo ? (
            <video
              src={`${API_BASE}/uploads/${current.filename}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={`${API_BASE}/uploads/${current.filename}`}
              alt={current.caption || "Wedding photo"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>
      )}

      {/* Caption overlay */}
      {current && (current.caption || current.guestName) && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-black/70 to-transparent text-center">
          {current.caption && (
            <p className="font-serif text-2xl text-white mb-1">
              {current.caption}
            </p>
          )}
          {current.guestName && (
            <p className="text-white/50 text-sm">— {current.guestName}</p>
          )}
        </div>
      )}

      {/* Progress dots */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {media.slice(0, 20).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-white" : "bg-white/20"
              }`}
            />
          ))}
          {media.length > 20 && (
            <span className="text-white/40 text-xs ml-1">
              +{media.length - 20}
            </span>
          )}
        </div>
      )}

      {/* Keyboard hint */}
      {!fullscreen && media.length > 0 && (
        <div className="absolute bottom-4 right-4 z-20 text-white/30 text-xs">
          ← → navigate · F fullscreen · Esc exit
        </div>
      )}
    </main>
  );
}
