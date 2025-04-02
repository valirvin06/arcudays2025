import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getTeamIconColor(color?: string): { bg: string; text: string } {
  const defaultColor = {
    bg: "bg-blue-100",
    text: "text-blue-500",
  };

  if (!color) return defaultColor;

  const safeColor = color.toLowerCase();
  const validColors = ["blue", "green", "yellow", "orange", "purple", "red", "teal", "indigo"];

  if (!validColors.includes(safeColor)) return defaultColor;

  return {
    bg: `bg-${safeColor}-100`,
    text: `text-${safeColor}-500`,
  };
}

export function getMedalTypeInfo(medalType: string) {
  switch (medalType) {
    case 'GOLD':
      return { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    case 'SILVER':
      return { label: 'Silver', color: 'bg-gray-100 text-gray-800' };
    case 'BRONZE':
      return { label: 'Bronze', color: 'bg-orange-100 text-orange-800' };
    case 'NON_WINNER':
      return { label: 'Non-Winner', color: 'bg-blue-100 text-blue-800' };
    case 'NO_ENTRY':
      return { label: 'No Entry', color: 'bg-red-100 text-red-800' };
    default:
      return { label: medalType, color: 'bg-gray-100 text-gray-800' };
  }
}

export function getEventStatusInfo(status: string) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    case 'ONGOING':
      return { label: 'Ongoing', color: 'bg-blue-100 text-blue-800' };
    case 'UPCOMING':
      return { label: 'Upcoming', color: 'bg-purple-100 text-purple-800' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' };
  }
}
