"use client";

import { QRCodeSVG } from "qrcode.react";
import { Camera, Image as ImageIcon, Play, Download } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [showQR, setShowQR] = useState(false);
  const uploadUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/upload`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-400 mb-3">
            Welcome to our wedding
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-stone-800 mb-4">
            Share Your Moments
          </h1>
          <div className="w-16 h-px bg-rose-300 mx-auto mb-6" />
          <p className="text-stone-600 text-lg leading-relaxed">
            Help us capture every angle of our special day. Upload your photos
            and videos — they&apos;ll appear in our live gallery instantly.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Upload */}
          <a
            href="/upload"
            className="group bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-md hover:border-rose-200 transition-all"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <Camera className="w-7 h-7 text-rose-500" />
            </div>
            <h2 className="font-serif text-xl text-stone-800 mb-1">
              Upload Photos
            </h2>
            <p className="text-sm text-stone-500">
              Share your snaps and clips
            </p>
          </a>

          {/* Gallery */}
          <a
            href="/gallery"
            className="group bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-md hover:border-rose-200 transition-all"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ImageIcon className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="font-serif text-xl text-stone-800 mb-1">
              View Gallery
            </h2>
            <p className="text-sm text-stone-500">
              Browse everyone&apos;s photos
            </p>
          </a>

          {/* Slideshow */}
          <a
            href="/slideshow"
            className="group bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-md hover:border-rose-200 transition-all"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <Play className="w-7 h-7 text-violet-500" />
            </div>
            <h2 className="font-serif text-xl text-stone-800 mb-1">
              Live Slideshow
            </h2>
            <p className="text-sm text-stone-500">
              Auto-playing photo wall
            </p>
          </a>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
          <h2 className="font-serif text-2xl text-stone-800 mb-2">
            QR Code for Guests
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            Display this at tables or print it for your welcome sign
          </p>

          {showQR ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-6 rounded-xl border-2 border-stone-100">
                <QRCodeSVG
                  value={uploadUrl}
                  size={256}
                  level="H"
                  fgColor="#44403c"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs text-stone-400 break-all max-w-xs">
                {uploadUrl}
              </p>
              <a
                href="/qr-download"
                className="inline-flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600"
              >
                <Download className="w-4 h-4" />
                Download QR as SVG
              </a>
            </div>
          ) : (
            <button
              onClick={() => setShowQR(true)}
              className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
            >
              Show QR Code
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-stone-400 mt-12">
          Made with love for our wedding day
        </p>
      </div>
    </main>
  );
}
