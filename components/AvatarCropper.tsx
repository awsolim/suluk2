"use client";

import Cropper, { Area } from "react-easy-crop";
import { useCallback, useMemo, useState } from "react";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
};

async function createCroppedImageBlob(imageSrc: string, cropPixels: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error("Failed to create image blob"));
      else resolve(b);
    }, "image/jpeg", 0.92);
  });

  return blob;
}

export default function AvatarCropper({ imageSrc, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  const canSave = useMemo(() => !!croppedPixels && !saving, [croppedPixels, saving]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b p-4">
          <div className="text-lg font-semibold">Crop profile picture</div>
          <div className="text-sm text-neutral-600">Drag to reposition, use zoom.</div>
        </div>

        <div className="relative h-80 bg-neutral-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-4">
          <label className="mb-2 block text-sm font-medium">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canSave}
              onClick={async () => {
                if (!croppedPixels) return;
                setSaving(true);
                try {
                  const blob = await createCroppedImageBlob(imageSrc, croppedPixels);
                  await onConfirm(blob);
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              Save crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
