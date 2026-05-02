import { format, differenceInDays, parseISO } from "date-fns";

export const formatCurrency = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (d) => {
  if (!d) return "-";
  try {
    return format(typeof d === "string" ? parseISO(d) : d, "dd MMM yyyy");
  } catch {
    return "-";
  }
};

export const formatDateShort = (d) => {
  if (!d) return "-";
  try {
    return format(typeof d === "string" ? parseISO(d) : d, "dd/MM/yyyy");
  } catch {
    return "-";
  }
};

export const formatDateTime = (d) => {
  if (!d) return "-";
  try {
    return format(typeof d === "string" ? parseISO(d) : d, "dd MMM yyyy, hh:mm a");
  } catch {
    return "-";
  }
};

export const daysLeft = (expiry) => {
  if (!expiry) return 0;
  try {
    return differenceInDays(parseISO(expiry), new Date());
  } catch {
    return 0;
  }
};

export const waLink = (phone, msg) =>
  `https://wa.me/91${(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const COLORS = [
  "bg-teal-500", "bg-orange-500", "bg-blue-500", "bg-purple-500",
  "bg-pink-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500",
];
export const avatarColor = (seed) => {
  const s = (seed || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[s % COLORS.length];
};

export const statusBadgeClass = (status) => {
  const s = (status || "").toUpperCase();
  const map = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    EXPIRED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    FROZEN: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    PAID: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    OVERDUE: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    NEW: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    CONTACTED: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    INTERESTED: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    CONVERTED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    LOST: "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  };
  return map[s] || map.NEW;
};

export const daysLeftBadge = (n) => {
  if (n < 0) return "bg-red-100 text-red-800 border-red-200";
  if (n <= 2) return "bg-red-100 text-red-800 border-red-200";
  if (n <= 5) return "bg-orange-100 text-orange-800 border-orange-200";
  if (n <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
};

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Chandigarh",
  "Jammu and Kashmir","Ladakh","Puducherry",
];
