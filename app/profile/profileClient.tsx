"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { createBrowserClient } from "@supabase/ssr";
import { getCroppedImageBlob, type CroppedAreaPixels } from "@/lib/cropImage";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  image_path: string | null;
};

const DEFAULT_AVATAR_PATH = "avatars/default.jpg";

export default function ProfileClient() {
  const router = useRouter();

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // Current values (shown as placeholders)
  const [currentFullName, setCurrentFullName] = useState<string>("");
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>("");

  // Draft edits (inputs start empty)
  const [fullNameDraft, setFullNameDraft] = useState<string>("");
  const [phoneDraft, setPhoneDraft] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");

  // Avatar (public URL)
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Local new image preview + crop
  const [localImageSrc, setLocalImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  function publicMediaUrl(path: string) {
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        if (mounted) router.push("/login");
        return;
      }

      const u = userData.user;
      if (!mounted) return;

      setUserId(u.id);
      setEmail(u.email ?? "");

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number, image_path")
        .eq("id", u.id)
        .single();

      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }

      const p = profile as ProfileRow;

      const full = p.full_name ?? "";
      const phone = p.phone_number ?? "";

      setCurrentFullName(full);
      setCurrentPhoneNumber(phone);

      const path = p.image_path && p.image_path.trim() !== "" ? p.image_path : DEFAULT_AVATAR_PATH;

      // Use logical OR to avoid empty-string src (prevents your screenshot warning)
      const url = publicMediaUrl(path);
      setAvatarUrl(`${url}?v=${Date.now()}`);

      setLoading(false);
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const onCropComplete = (_: any, pixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(pixels);
  };

  const handleChooseFile = (file: File) => {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP file.");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setLocalImageSrc(String(reader.result));
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  async function uploadCroppedAvatarIfNeeded(uid: string): Promise<string | null> {
    if (!localImageSrc || !croppedAreaPixels) return null;

    const blob = await getCroppedImageBlob(localImageSrc, croppedAreaPixels);

    // Stable path so we don't fill storage with many files
    const objectPath = `avatars/${uid}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage.from("media").upload(objectPath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });

    if (uploadError) throw uploadError;

    // Update the preview immediately
    const url = publicMediaUrl(objectPath);
    setAvatarUrl(`${url}?v=${Date.now()}`);

    // Reset crop UI
    setLocalImageSrc(null);
    setCroppedAreaPixels(null);

    return objectPath;
  }

  async function handleSave() {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      // 1) Upload avatar if user selected a new one
      const newImagePath = await uploadCroppedAvatarIfNeeded(userId);

      // 2) Update password if provided
      if (newPassword.trim()) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword.trim() });
        if (pwErr) throw pwErr;
        setNewPassword("");
      }

      // 3) Update profiles row (use drafts if provided, otherwise keep current)
      const nextFullName =
        fullNameDraft.trim() !== "" ? fullNameDraft.trim() : (currentFullName.trim() !== "" ? currentFullName : null);

      const nextPhone =
        phoneDraft.trim() !== "" ? phoneDraft.trim() : (currentPhoneNumber.trim() !== "" ? currentPhoneNumber : null);

      const updates: Partial<ProfileRow> = {
        full_name: nextFullName,
        phone_number: nextPhone,
      };

      if (newImagePath) updates.image_path = newImagePath;

      const { error: profileUpdateErr } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (profileUpdateErr) throw profileUpdateErr;

      // Keep placeholders in sync after save
      setCurrentFullName(nextFullName ?? "");
      setCurrentPhoneNumber(nextPhone ?? "");
      setFullNameDraft("");
      setPhoneDraft("");

      // 4) Exit
      router.push("/dashboard");
      router.refresh(); // Helps ensure server Shell refetches and top-right avatar updates immediately
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const displayAvatarSrc =
    (localImageSrc && localImageSrc.trim() !== "" ? localImageSrc : "") ||
    (avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : "") ||
    `${publicMediaUrl(DEFAULT_AVATAR_PATH)}?v=${Date.now()}`;

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayAvatarSrc} alt="Profile avatar" className="h-full w-full object-cover" />
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium">Profile picture</p>

              <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110">
                Choose file
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleChooseFile(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              <p className="text-xs text-neutral-600">Accepted: JPG, PNG, WEBP</p>
            </div>
          </div>

          {localImageSrc && (
            <div className="grid gap-4">
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border bg-neutral-100">
                <Cropper
                  image={localImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-600">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                type="button"
                className="w-fit rounded-full border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => {
                  setLocalImageSrc(null);
                  setZoom(1);
                  setCrop({ x: 0, y: 0 });
                  setCroppedAreaPixels(null);
                }}
              >
                Cancel new picture
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Full name</label>
            <input
              className="w-full rounded-xl border px-4 py-3"
              value={fullNameDraft}
              placeholder={currentFullName || "Enter your name"}
              onChange={(e) => setFullNameDraft(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Phone number</label>
            <input
              className="w-full rounded-xl border px-4 py-3"
              value={phoneDraft}
              placeholder={currentPhoneNumber || "Enter phone number"}
              onChange={(e) => setPhoneDraft(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <input className="w-full rounded-xl border bg-neutral-50 px-4 py-3 text-neutral-700" value={email} readOnly />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">New password</label>
            <input
              type="password"
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Leave blank to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3">
        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="button"
          className="rounded-full bg-red-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save and exit"}
        </button>
      </div>
    </div>
  );
}
