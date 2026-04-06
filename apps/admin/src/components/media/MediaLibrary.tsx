import { useCallback, useEffect, useState } from "react";
import { deleteMedia, listMedia, updateMedia } from "../../api/media";
import type { MediaRecord } from "../../api/media";
import { MediaCard } from "./MediaCard";
import { MediaUpload } from "./MediaUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 24;

type MediaLibraryProps = {
  onSelect?: (media: MediaRecord) => void;
};

type EditState = {
  media: MediaRecord;
  altText: string;
  filename: string;
  saving: boolean;
  error: string | null;
};

export function MediaLibrary({ onSelect }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [mimeType, setMimeType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  const load = useCallback(async (nextSearch: string, nextMimeType: string, nextOffset: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await listMedia({
        search: nextSearch || undefined,
        mimeType: nextMimeType === "all" ? undefined : nextMimeType,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });

      setItems(result.media);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(search, mimeType, offset);
  }, [load, search, mimeType, offset]);

  function handleUploaded(media: MediaRecord) {
    setItems((prev) => [media, ...prev]);
    setTotal((prev) => prev + 1);
  }

  function handleSelectCard(media: MediaRecord) {
    if (onSelect) {
      onSelect(media);
    } else {
      setEdit({
        media,
        altText: media.altText ?? "",
        filename: media.filename,
        saving: false,
        error: null,
      });
    }
  }

  async function handleSaveEdit() {
    if (!edit) return;

    setEdit((prev) => prev && { ...prev, saving: true, error: null });

    try {
      const updated = await updateMedia(edit.media.id, {
        altText: edit.altText || null,
        filename: edit.filename,
      });

      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEdit(null);
    } catch (err) {
      setEdit((prev) =>
        prev && { ...prev, saving: false, error: err instanceof Error ? err.message : "Save failed" },
      );
    }
  }

  async function handleDelete(media: MediaRecord) {
    const confirmed = window.confirm(`Delete "${media.filename}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const result = await deleteMedia(media.id);
      setItems((prev) => prev.filter((m) => m.id !== media.id));
      setTotal((prev) => prev - 1);

      if (result.referenced) {
        alert("Warning: this image was referenced in one or more documents. Those documents may display broken images.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-4">
      <MediaUpload onUploaded={handleUploaded} />

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="search"
          placeholder="Search by filename or alt text..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          className="w-64"
        />

        <Select value={mimeType} onValueChange={(v) => { setMimeType(v); setOffset(0); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image/png">PNG</SelectItem>
            <SelectItem value="image/jpeg">JPEG</SelectItem>
            <SelectItem value="image/gif">GIF</SelectItem>
            <SelectItem value="image/svg+xml">SVG</SelectItem>
            <SelectItem value="image/webp">WebP</SelectItem>
            <SelectItem value="application/pdf">PDF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No media found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((m) => (
            <MediaCard
              key={m.id}
              media={m}
              onSelect={handleSelectCard}
              onEdit={onSelect ? undefined : handleSelectCard}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={Boolean(edit)} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>

          {edit && (
            <div className="space-y-4">
              {edit.media.mimeType.startsWith("image/") && (
                <img
                  src={edit.media.url}
                  alt={edit.media.altText ?? edit.media.filename}
                  className="w-full max-h-64 object-contain rounded-md bg-muted"
                />
              )}

              <div className="grid gap-2">
                <Label>Filename</Label>
                <Input
                  type="text"
                  value={edit.filename}
                  onChange={(e) => setEdit((prev) => prev && { ...prev, filename: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Alt text</Label>
                <Input
                  type="text"
                  value={edit.altText}
                  onChange={(e) => setEdit((prev) => prev && { ...prev, altText: e.target.value })}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {edit.media.mimeType} &middot; {(edit.media.sizeBytes / 1024).toFixed(1)} KB
                {edit.media.width && edit.media.height
                  ? ` \u00b7 ${edit.media.width}\u00d7${edit.media.height}`
                  : ""}
              </p>

              {edit.error && <p className="text-sm text-destructive">{edit.error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={edit?.saving}>
              {edit?.saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
