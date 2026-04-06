import type { AdminRevision } from "../../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type RevisionListProps = {
  revisions: AdminRevision[];
  selectedRevisionId: string | null;
  onSelect: (revisionId: string) => void;
};

function actionLabel(action: AdminRevision["action"]) {
  if (action === "publish") return "Published";
  if (action === "rollback") return "Rolled back";
  return "Saved";
}

export function RevisionList({ revisions, selectedRevisionId, onSelect }: RevisionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revision history</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1 p-3">
            {revisions.map((revision) => (
              <Button
                key={revision.id}
                variant={selectedRevisionId === revision.id ? "secondary" : "ghost"}
                className="w-full justify-between h-auto py-2"
                onClick={() => onSelect(revision.id)}
              >
                <strong className="text-sm">{actionLabel(revision.action)}</strong>
                <span className="text-xs text-muted-foreground">
                  {new Date(revision.createdAt).toLocaleString()}
                </span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
