"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [caption, setCaption] = useState("");
  const [guestName, setGuestName] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setStatus("uploading");
      setErrorMsg("");
      let successCount = 0;
      let lastError = "";

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", caption);
        formData.append("guestName", guestName);

        try {
          const res = await fetch(`${API_BASE}/api/upload`, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            const data = await res.json();
            lastError = data.error || "Upload failed";
          } else {
            successCount++;
          }
        } catch {
          lastError = "Network error — please try again";
        }
      }

      setUploadedCount(successCount);
      if (successCount > 0) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(lastError);
      }
    },
    [caption, guestName]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "image/heic": [".heic"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/webm": [".webm"],
    },
    maxFiles: 20,
    maxSize: 100 * 1024 * 1024,
    disabled: status === "uploading",
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <a href="/" className="text-sm text-stone-400 hover:text-stone-600">
            ← Back
          </a>
          <h1 className="font-serif text-4xl text-stone-800 mt-4 mb-2">
            Upload Your Photos
          </h1>
          <div className="w-12 h-px bg-rose-300 mx-auto mb-4" />
          <p className="text-stone-600">
            Drag and drop or tap to select — photos and videos welcome
          </p>
        </div>

        {/* Guest Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Aunt Jane"
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-stone-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Caption (optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. First dance!"
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            bg-white rounded-2xl p-12 shadow-sm border-2 border-dashed transition-all cursor-pointer
            ${
              isDragActive
                ? "border-rose-400 bg-rose-50 scale-[1.01]"
                : "border-stone-200 hover:border-rose-300"
            }
            ${status === "uploading" ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input {...getInputProps()} />

          {status === "uploading" ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
              <p className="text-stone-600 font-medium">Uploading...</p>
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-stone-800 font-serif text-xl">
                {uploadedCount} {uploadedCount === 1 ? "photo" : "photos"} uploaded!
              </p>
              <p className="text-sm text-stone-500">
                Thank you for sharing. Upload more or view the gallery.
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatus("idle");
                    setUploadedCount(0);
                  }}
                  className="px-5 py-2.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors text-sm"
                >
                  Upload More
                </button>
                <a
                  href="/gallery"
                  onClick={(e) => e.stopPropagation()}
                  className="px-5 py-2.5 bg-white text-stone-700 rounded-full font-medium border border-stone-200 hover:border-stone-300 transition-colors text-sm"
                >
                  View Gallery
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-rose-400" />
              </div>
              <p className="font-serif text-xl text-stone-800">
                {isDragActive
                  ? "Drop your photos here"
                  : "Drag & drop or tap to browse"}
              </p>
              <p className="text-sm text-stone-400">
                JPG, PNG, WebP, HEIC, MP4, MOV — up to 100MB each
              </p>
            </div>
          )}
        </div>

        {status === "error" && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Tip */}
        <p className="text-center text-xs text-stone-400 mt-6">
          Tip: If upload fails, text your photos to the couple directly
        </p>
      </div>
    </main>
  );
}
