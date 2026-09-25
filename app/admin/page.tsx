"use client";

import { useEffect, useState } from "react";
import { Lock, Check, X, Trash2, Download, RefreshCw } from "lucide-react";
import { API_BASE } from "@/lib/api";

type MediaItem = {
  id: string;
  filename: string;
  originalName: string;
  caption: string;
  guestName: string;
  mimeType: string;
  uploadedAt: string;
  approved: boolean;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin";

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upload?admin=true`);
      const data = await res.json();
      setMedia(data.media || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      fetchMedia();
      const interval = setInterval(fetchMedia, 10000);
      return () => clearInterval(interval);
    }
  }, [authed]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
    }
  };

  const toggleApproval = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/media/${id}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${adminPassword}`,
      },
    });
    if (res.ok) {
      fetchMedia();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photo permanently?")) return;
    const res = await fetch(`${API_BASE}/api/media/${id}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${adminPassword}`,
      },
    });
    if (res.ok) {
      fetchMedia();
    }
  };

  const downloadAll = () => {
    // Open each media in a new tab for download
    media.forEach((item) => {
      const link = document.createElement("a");
      link.href = `${API_BASE}/uploads/${item.filename}`;
      link.download = item.originalName || item.filename;
      link.click();
    });
  };

  // Login screen
  if (!authed) {
    return (
      <main className="min-h-screen bg-stone-900 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-stone-800 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-stone-700 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-stone-400" />
            </div>
            <h1 className="font-serif text-2xl text-white">Admin Access</h1>
            <p className="text-sm text-stone-400 mt-1">
              Enter password to manage photos
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-white placeholder-stone-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-900 outline-none"
            />
            {authError && (
              <p className="text-red-400 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
            >
              Log In
            </button>
          </form>
          <p className="text-xs text-stone-500 mt-4 text-center">
            Default password: <code className="text-stone-400">admin</code>
            <br />
            Set ADMIN_PASSWORD env var to change
          </p>
        </div>
      </main>
    );
  }

  // Admin dashboard
  const pending = media.filter((m) => !m.approved);
  const approved = media.filter((m) => m.approved);

  return (
    <main className="min-h-screen bg-stone-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="font-serif text-3xl text-stone-800">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMedia}
              className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={downloadAll}
              className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800"
            >
              <Download className="w-4 h-4" />
              Download All
            </button>
            <a href="/" className="text-sm text-stone-400 hover:text-stone-600">
              Exit
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-serif text-stone-800">{media.length}</p>
            <p className="text-xs text-stone-500 mt-1">Total Photos</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-serif text-green-600">{approved.length}</p>
            <p className="text-xs text-stone-500 mt-1">Approved</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-serif text-amber-600">{pending.length}</p>
            <p className="text-xs text-stone-500 mt-1">Pending Review</p>
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-3 border-stone-200 border-t-rose-500 animate-spin" />
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-stone-600">No photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className={`relative group rounded-xl overflow-hidden shadow-sm border-2 ${
                  item.approved ? "border-transparent" : "border-amber-400"
                }`}
              >
                {item.mimeType.startsWith("video/") ? (
                  <video
                    src={`${API_BASE}/uploads/${item.filename}`}
                    className="w-full aspect-square object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={`${API_BASE}/uploads/${item.filename}`}
                    alt={item.caption || "Photo"}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                )}

                {/* Status badge */}
                {!item.approved && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full">
                    Pending
                  </div>
                )}

                {/* Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => toggleApproval(item.id)}
                    className={`p-2 rounded-full ${
                      item.approved
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                    title={item.approved ? "Unapprove" : "Approve"}
                  >
                    {item.approved ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Info */}
                {(item.caption || item.guestName) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs">
                    {item.caption && (
                      <p className="truncate font-medium">{item.caption}</p>
                    )}
                    {item.guestName && (
                      <p className="text-white/60 truncate">{item.guestName}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
