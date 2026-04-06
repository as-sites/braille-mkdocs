import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: "draft" | "published" | "archived";
};

const statusConfig = {
  draft: { label: "Draft", className: "bg-amber-50 text-amber-800 border-amber-300" },
  published: { label: "Published", className: "bg-green-50 text-green-800 border-green-300" },
  archived: { label: "Archived", className: "bg-stone-100 text-stone-600 border-stone-300" },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
