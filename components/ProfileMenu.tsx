"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ProfileMenu({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const hasAvatar = !!avatarUrl && avatarUrl.trim() !== "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium hover:bg-gray-50"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl!} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 13a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          )}
        </span>

        <span className="max-w-[160px] truncate">{fullName || "Profile"}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border bg-white shadow-sm">
          <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50">
            Edit profile
          </Link>
        </div>
      )}
    </div>
  );
}
