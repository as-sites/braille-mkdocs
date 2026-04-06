import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Minus } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";

export type TreeNode = {
  id: string;
  path: string;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  parentPath: string;
  children: TreeNode[];
};

type DocumentTreeItemProps = {
  node: TreeNode;
  level: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  onArchive: (node: TreeNode) => void;
};

export function DocumentTreeItem({
  node,
  level,
  expanded,
  onToggle,
  onArchive,
}: DocumentTreeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className="flex items-center gap-2 border border-border rounded-md bg-card px-2 py-1.5"
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onToggle(node.id)}
          disabled={node.children.length === 0}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {node.children.length === 0 ? (
            <Minus className="h-3 w-3" />
          ) : expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </Button>

        <div className="flex-1 min-w-0">
          <Link to={`/documents/${node.id}/edit`} className="font-semibold text-sm hover:underline">
            {node.title}
          </Link>
          <p className="text-xs text-muted-foreground">{new Date(node.updatedAt).toLocaleString()}</p>
        </div>

        <StatusBadge status={node.status} />

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to={`/documents/${node.id}/preview`}>Preview</Link>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to={`/documents/${node.id}/history`}>History</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onArchive(node)}
          >
            {node.status === "archived" ? "Keep archived" : "Archive"}
          </Button>
        </div>
      </div>
    </li>
  );
}
