import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { createDocument, listDocuments, type AdminDocumentSummary } from "../api/client";
import { DocumentCreateForm } from "../components/documents/DocumentCreateForm";
import { useToaster } from "../components/shared/Toaster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DocumentNewPage() {
  const navigate = useNavigate();
  const { showToast } = useToaster();

  const [documents, setDocuments] = useState<AdminDocumentSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await listDocuments({ limit: 300 });
        if (!cancelled) setDocuments(result.items);
      } catch {
        if (!cancelled) showToast("Could not load parent documents.", "error");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [showToast]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Document</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Fill in the title, choose where it belongs, and adjust the URL slug if needed.
          </p>
          <DocumentCreateForm
            parents={documents.map((doc) => ({ path: doc.path, title: doc.title }))}
            onSubmit={async (payload) => {
              try {
                const created = await createDocument(payload);
                showToast("Document created.", "success");
                navigate(`/documents/${created.id}/edit`);
              } catch {
                showToast("Could not create document.", "error");
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
