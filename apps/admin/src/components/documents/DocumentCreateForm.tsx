import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ParentOption = {
  path: string;
  title: string;
};

type DocumentCreateFormProps = {
  parents: ParentOption[];
  onSubmit: (payload: { title: string; parentPath: string; slug: string }) => Promise<void>;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const TOP_LEVEL = "__top_level__";

export function DocumentCreateForm({ parents, onSubmit }: DocumentCreateFormProps) {
  const [title, setTitle] = useState("");
  const [parentPath, setParentPath] = useState(TOP_LEVEL);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => title.trim().length > 0 && slug.trim().length > 0, [slug, title]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), parentPath: parentPath === TOP_LEVEL ? "" : parentPath, slug: slug.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="create-title">Title</Label>
        <Input
          id="create-title"
          type="text"
          value={title}
          onChange={(e) => {
            const next = e.target.value;
            setTitle(next);
            if (!slugTouched) setSlug(slugify(next));
          }}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label>Parent document</Label>
        <Select value={parentPath} onValueChange={setParentPath}>
          <SelectTrigger>
            <SelectValue placeholder="Top level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOP_LEVEL}>Top level</SelectItem>
            {parents.map((parent) => (
              <SelectItem key={parent.path} value={parent.path}>
                {parent.title} ({parent.path})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="create-slug">Slug</Label>
        <Input
          id="create-slug"
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          required
        />
      </div>

      <Button type="submit" disabled={!canSubmit || saving}>
        {saving ? "Creating..." : "Create document"}
      </Button>
    </form>
  );
}
