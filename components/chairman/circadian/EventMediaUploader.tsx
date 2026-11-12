"use client";

import React, { useCallback, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { MEDIA_PRESETS, MediaTypeEnum } from "@/lib/circadianTypes";

export interface EventMediaUploaderProps {
  mediaUrl: string;
  mediaType: MediaTypeEnum;
  onChangeMedia: (next: {
    mediaUrl: string;
    mediaType: MediaTypeEnum;
    accentColor?: string;
  }) => void;
}

async function compressImageFileToDataUrl(
  file: File,
  maxWidth = 1280,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read media file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function EventMediaUploader({
  mediaUrl,
  mediaType,
  onChangeMedia,
}: EventMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const processSelectedFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadNotice(null);

      const isVideo =
        file.type.startsWith("video/") ||
        /\.(mp4|webm|mov)$/i.test(file.name);
      const detectedType: MediaTypeEnum = isVideo ? "video_loop" : "image";

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // 1. Try Supabase Storage bucket (`circadian-media`) when configured
        if (supabaseUrl && supabaseAnonKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseAnonKey);
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const objectPath = `events/${Date.now()}-${safeName}`;
            const { error } = await supabase.storage
              .from("circadian-media")
              .upload(objectPath, file, {
                cacheControl: "3600",
                upsert: true,
              });

            if (!error) {
              const { data } = supabase.storage
                .from("circadian-media")
                .getPublicUrl(objectPath);
              if (data?.publicUrl) {
                onChangeMedia({
                  mediaUrl: data.publicUrl,
                  mediaType: detectedType,
                });
                setUploadNotice("Uploaded to Supabase Storage (circadian-media)");
                return;
              }
            }
          } catch {
            // Fall through seamlessly to zero-dependency local Data/Object URL encoding
          }
        }

        // 2. Resilient local encoding so drag-and-drop works 100% offline/locally
        let encodedUrl: string;
        if (isVideo) {
          // Use persistent Data URL if <= 6MB, otherwise instant Object URL
          if (file.size <= 6 * 1024 * 1024) {
            encodedUrl = await readFileAsDataUrl(file);
          } else {
            encodedUrl = URL.createObjectURL(file);
          }
        } else {
          encodedUrl = await compressImageFileToDataUrl(file);
        }

        onChangeMedia({
          mediaUrl: encodedUrl,
          mediaType: detectedType,
        });
        setUploadNotice(`Locked ${file.name} (${detectedType === "video_loop" ? "MP4 Loop" : "16:9 Still"})`);
      } finally {
        setUploading(false);
      }
    },
    [onChangeMedia]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processSelectedFile(file);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Header & Media Type Switch */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
          Visual Media Anchor (16:9 Wedge & Card)
        </label>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => onChangeMedia({ mediaUrl, mediaType: "image" })}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              mediaType === "image"
                ? "bg-white/15 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ImageIcon size={11} /> Image
          </button>
          <button
            type="button"
            onClick={() => onChangeMedia({ mediaUrl, mediaType: "video_loop" })}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              mediaType === "video_loop"
                ? "bg-white/15 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Film size={11} /> MP4 Loop
          </button>
        </div>
      </div>

      {/* Drag-and-Drop Dropzone + Live 16:9 Thumbnail Preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex items-center gap-3.5 rounded-xl border border-dashed p-2.5 cursor-pointer transition-all ${
          isDraggingOver
            ? "border-amber-400 bg-amber-400/10"
            : "border-white/15 bg-white/[0.03] hover:border-amber-400/50 hover:bg-white/[0.06]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processSelectedFile(file);
          }}
        />

        {/* Live 16:9 Mini Preview */}
        <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
          {mediaType === "video_loop" ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Selected circadian media"
              className="w-full h-full object-cover"
            />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-amber-400" />
            </div>
          )}
        </div>

        {/* Dropzone Copy */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
            <UploadCloud size={14} className="text-amber-400 shrink-0" />
            <span className="truncate">
              {uploading
                ? "Encoding high-impact visual wedge..."
                : "Drag & drop 16:9 image or MP4 loop, or click to browse"}
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-0.5">
            Supports JPG, PNG, WebP, or muted MP4/WebM ambient loops · Auto-syncs Supabase Storage
          </p>
          {uploadNotice && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-medium">
              <CheckCircle2 size={11} />
              <span className="truncate">{uploadNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Curated 16:9 Circadian Presets */}
      <div className="grid grid-cols-5 gap-2">
        {MEDIA_PRESETS.map((p) => {
          const active = mediaUrl === p.url;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                setUploadNotice(null);
                onChangeMedia({
                  mediaUrl: p.url,
                  mediaType: "image",
                  accentColor: p.accent,
                });
              }}
              className={`group relative aspect-video rounded-lg overflow-hidden border transition-all ${
                active
                  ? "border-amber-400 ring-2 ring-amber-400/40 scale-[1.02]"
                  : "border-white/10 opacity-75 hover:opacity-100"
              }`}
            >
              <img
                src={p.url}
                alt={p.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute bottom-1 left-1 right-1 text-[8.5px] font-semibold text-white truncate">
                {p.label.split(" (")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Direct Custom URL Input */}
      <input
        type="text"
        value={mediaUrl.startsWith("data:") ? "" : mediaUrl}
        onChange={(e) =>
          onChangeMedia({ mediaUrl: e.target.value, mediaType })
        }
        placeholder={
          mediaUrl.startsWith("data:")
            ? "Local uploaded media active — paste URL here to override..."
            : "/circadian/gym-workout.jpg or https://..."
        }
        className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400/60"
      />
    </div>
  );
}
