import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listDocuments, type AdminDocumentSummary } from "../api/client";
import { StatusBadge } from "../components/documents/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function relativeTime(value: string) {
  const now = Date.now();
  const target = new Date(value).getTime();

  if (Number.isNaN(target)) {
    return "Unknown";
  }

  const minutes = Math.max(1, Math.floor((now - target) / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DashboardPage() {
  const [recentlyEdited, setRecentlyEdited] = useState<AdminDocumentSummary[]>([]);
  const [recentPublishes, setRecentPublishes] = useState<AdminDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [edited, published] = await Promise.all([
          listDocuments({ limit: 10 }),
          listDocuments({ status: "published", limit: 10 }),
        ]);

        if (cancelled) return;

        setRecentlyEdited(edited.items);
        setRecentPublishes(published.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome back. Pick up where you left off.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to="/documents/new">Create document</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/documents">Browse documents</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/settings">Open settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recently edited</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <ul className="space-y-2 list-none p-0 m-0">
              {recentlyEdited.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 flex-wrap">
                  <Link to={`/documents/${doc.id}/edit`} className="font-medium text-primary hover:underline">
                    {doc.title}
                  </Link>
                  <StatusBadge status={doc.status} />
                  <span className="text-sm text-muted-foreground">{relativeTime(doc.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent publishes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <ul className="space-y-2 list-none p-0 m-0">
              {recentPublishes.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 flex-wrap">
                  <Link to={`/documents/${doc.id}/preview`} className="font-medium text-primary hover:underline">
                    {doc.title}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {doc.publishedAt ? relativeTime(doc.publishedAt) : "Not published"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
