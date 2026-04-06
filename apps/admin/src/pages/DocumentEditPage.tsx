import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import type { JSONContent } from "@tiptap/react";

import {
  getDocument,
  publishDocument,
  saveDocument,
  type AdminDocument,
} from "../api/client";
import { Editor } from "../components/editor/Editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function formatTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function safeParseMetadata(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Metadata must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}

function getEditorDoc(document: AdminDocument | null, editorJson: JSONContent): JSONContent {
  if (!document) return editorJson;
  const source = document.prosemirrorJson as JSONContent | null;
  return source && source.type ? source : EMPTY_DOC;
}

export function DocumentEditPage() {
  const { id = "" } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<AdminDocument | null>(null);
  const [editorJson, setEditorJson] = useState<JSONContent>(EMPTY_DOC);
  const [dirty, setDirty] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metadataText, setMetadataText] = useState("{}");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setLoading(false);
        setError("Missing document ID in route params");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextDocument = await getDocument(id);
        if (cancelled) return;

        setDocument(nextDocument);
        setEditorJson((nextDocument.prosemirrorJson as JSONContent | null) ?? EMPTY_DOC);
        setTitle(nextDocument.title);
        setDescription(nextDocument.description ?? "");
        setMetadataText(JSON.stringify(nextDocument.metadata ?? {}, null, 2));
        setLastSaveTime(nextDocument.updatedAt);
        setDirty(false);
      } catch {
        if (!cancelled) setError("Unable to load the document.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const editorContent = useMemo(() => getEditorDoc(document, editorJson), [document, editorJson]);

  async function onSave() {
    if (!id) return;

    try {
      const metadata = safeParseMetadata(metadataText);

      const updated = await saveDocument(id, {
        title: title.trim() || undefined,
        description: description.trim() || null,
        metadata,
        prosemirrorJson: editorJson as Record<string, unknown>,
      });

      setDocument(updated);
      setLastSaveTime(updated.updatedAt);
      setDirty(false);
      setError(null);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save document";
      setError(message);
    }
  }

  async function onPublish() {
    if (!id) return;

    try {
      const updated = await publishDocument(id);
      setDocument(updated);
      setError(null);
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "Failed to publish document";
      setError(message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error && !document) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Edit Document</h1>
          <p className="text-sm text-muted-foreground">{document?.path}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onSave}>
            Save
          </Button>
          <Button onClick={onPublish}>
            Publish
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap py-3">
          <span className="text-sm text-muted-foreground">
            Status: <Badge variant="outline">{document?.status ?? "draft"}</Badge>
          </span>
          <span className="text-sm text-muted-foreground">Last save: {formatTime(lastSaveTime)}</span>
          <span className="text-sm text-muted-foreground">Last publish: {formatTime(document?.publishedAt ?? null)}</span>
          {dirty && <span className="text-sm font-bold text-amber-600">Unsaved changes</span>}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <Card>
          <CardContent className="p-0">
            <Editor
              initialContent={editorContent}
              onUpdate={(nextJson) => {
                setEditorJson(nextJson);
                setDirty(true);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold">Metadata</h2>

            <div className="grid gap-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="doc-metadata">Metadata JSON</Label>
              <Textarea
                id="doc-metadata"
                value={metadataText}
                onChange={(e) => { setMetadataText(e.target.value); setDirty(true); }}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
