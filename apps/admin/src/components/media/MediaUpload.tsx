import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { uploadMedia } from "../../api/media";
import type { MediaRecord } from "../../api/media";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "application/pdf",
];

const MAX_BYTES = 10 * 1024 * 1024;

type MediaUploadProps = {
  onUploaded: (media: MediaRecord) => void;
};

export function MediaUpload({ onUploaded }: MediaUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("File exceeds 10 MB limit");
      return;
    }

    setUploading(true);

    try {
      const media = await uploadMedia(file);
      onUploaded(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading...</p>
        ) : (
          <div className="space-y-1">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm">Drag & drop a file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF, SVG, WebP, PDF &middot; max 10 MB
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={onInputChange}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
