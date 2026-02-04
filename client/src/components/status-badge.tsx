import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  PREPARING: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  READY: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  SHIPPING: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  DELIVERED: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  INACTIVE: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  DISCONTINUED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  OUT_OF_STOCK: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  ON_LEAVE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  EASY: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  SMALL: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  LARGE: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  XLARGE: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { language } = useApp();
  const colorClass = statusColors[status] || "bg-gray-500/10 text-gray-600";
  
  let label = status;
  if (status in { PENDING: 1, CONFIRMED: 1, PREPARING: 1, READY: 1, SHIPPING: 1, DELIVERED: 1, CANCELLED: 1 }) {
    label = t(`status.${status}`, language);
  } else if (status === 'ACTIVE') {
    label = t('catalog.active', language);
  } else if (status === 'INACTIVE') {
    label = t('catalog.inactive', language);
  } else if (status === 'DISCONTINUED') {
    label = t('catalog.discontinued', language);
  } else if (status === 'OUT_OF_STOCK') {
    label = t('shop.outOfStock', language);
  } else if (status === 'EASY') {
    label = t('shop.easy', language);
  } else if (status === 'MEDIUM') {
    label = t('shop.medium', language);
  } else if (status === 'HARD') {
    label = t('shop.hard', language);
  } else if (status === 'SMALL') {
    label = t('shop.small', language);
  } else if (status === 'LARGE') {
    label = t('shop.large', language);
  } else if (status === 'XLARGE') {
    label = t('shop.xlarge', language);
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} border font-medium ${className}`}
    >
      {label}
    </Badge>
  );
}
