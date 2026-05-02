import React from "react";
import { initials, avatarColor } from "@/lib/format";

export default function MemberAvatar({ name, photoUrl, size = 40, className = "" }) {
  const sz = `${size}px`;
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: sz, height: sz }}
      />
    );
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${avatarColor(name)} ${className}`}
      style={{ width: sz, height: sz, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
