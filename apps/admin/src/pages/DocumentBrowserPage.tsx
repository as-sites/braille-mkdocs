import { useEffect, useMemo, useState, type FormEvent } from "react";

import { archiveDocument, listDocuments, reorderChildren, type AdminDocumentSummary } from "../api/client";
import { DocumentTree } from "../components/documents/DocumentTree";
import type { TreeNode } from "../components/documents/DocumentTreeItem";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { useToaster } from "../components/shared/Toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function getParentPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function buildTree(items: AdminDocumentSummary[]): TreeNode[] {
  const byPath = new Map<string, TreeNode>();

  for (const item of items) {
    byPath.set(item.path, {
      id: item.id,
      path: item.path,
      title: item.title,
      status: item.status,
      updatedAt: item.updatedAt,
      parentPath: getParentPath(item.path),
      children: [],
    });
  }

  const roots: TreeNode[] = [];

  for (const node of byPath.values()) {
    const parent = byPath.get(node.parentPath);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByPath = (left: TreeNode, right: TreeNode) => left.path.localeCompare(right.path);

  const visit = (node: TreeNode) => {
    node.children.sort(sortByPath);
    for (const child of node.children) visit(child);
  };

  roots.sort(sortByPath);
  for (const root of roots) visit(root);

  return roots;
}

export function DocumentBrowserPage() {
  const { showToast } = useToaster();

  const [documents, setDocuments] = useState<AdminDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [searchText, setSearchText] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<TreeNode | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await listDocuments({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchText.trim() || undefined,
        limit: 500,
      });
      setDocuments(response.items);
    } catch {
      showToast("Could not load documents.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const tree = useMemo(() => buildTree(documents), [documents]);

  async function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await load();
  }

  async function confirmArchive() {
    if (!archiveTarget) return;

    try {
      await archiveDocument(archiveTarget.id);
      showToast("Document archived.", "success");
      setArchiveTarget(null);
      await load();
    } catch {
      showToast("Could not archive document.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Document Browser</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex items-center gap-3 flex-wrap" onSubmit={onSearchSubmit}>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft only</SelectItem>
                <SelectItem value="published">Published only</SelectItem>
                <SelectItem value="archived">Archived only</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="search"
              placeholder="Search by title"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
            />

            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : (
            <DocumentTree
              nodes={tree}
              onArchive={(node) => setArchiveTarget(node)}
              onReorder={async (parentPath, children) => {
                try {
                  await reorderChildren({ parentPath, children });
                  showToast("Order saved.", "success");
                } catch {
                  showToast("Could not save the new order.", "error");
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive this document"
        message="You can still find it later, but it will be marked as archived."
        confirmLabel="Archive"
        onConfirm={() => void confirmArchive()}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
