import React from "react";
import { Badge } from "@/components/ui/badge";
import { statusBadgeClass, daysLeftBadge } from "@/lib/format";

export function StatusBadge({ status, className = "" }) {
  return (
    <Badge variant="outline" className={`${statusBadgeClass(status)} ${className} font-medium`}>
      {status}
    </Badge>
  );
}

export function DaysLeftBadge({ days }) {
  const txt = days < 0 ? `${Math.abs(days)} din pehle expired` : days === 0 ? "Aaj expire" : `${days} din baaki`;
  return (
    <Badge variant="outline" className={`${daysLeftBadge(days)} font-medium`}>
      {txt}
    </Badge>
  );
}
