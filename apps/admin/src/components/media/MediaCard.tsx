import type { MediaRecord } from "../../api/media";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type MediaCardProps = {
  media: MediaRecord;
  onSelect?: (media: MediaRecord) => void;
  onDelete?: (media: MediaRecord) => void;
  onEdit?: (media: MediaRecord) => void;
  selected?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaCard({ media, onSelect, onDelete, onEdit, selected }: MediaCardProps) {
  const isImage = media.mimeType.startsWith("image/");

  return (
    <Card
      className={`cursor-pointer transition-colors hover:border-primary/50 ${selected ? "border-primary ring-1 ring-primary" : ""}`}
      onClick={() => onSelect?.(media)}
    >
      <CardContent className="p-2 space-y-2">
        <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {isImage ? (
            <img
              src={media.url}
              alt={media.altText ?? media.filename}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">PDF</span>
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-sm font-medium truncate" title={media.filename}>
            {media.filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(media.sizeBytes)}
            {media.width && media.height ? ` \u00b7 ${media.width}\u00d7${media.height}` : ""}
          </p>
          {media.altText && (
            <p className="text-xs text-muted-foreground truncate" title={media.altText}>
              Alt: {media.altText}
            </p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); onEdit(media); }}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(media); }}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
