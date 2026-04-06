import { useEffect, useState } from "react";

import { createApiKey, listApiKeys, revokeApiKey, type AdminApiKey } from "../../api/client";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { useToaster } from "../shared/Toaster";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function ApiKeyManager() {
  const { showToast } = useToaster();

  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const nextKeys = await listApiKeys();
      setKeys(nextKeys);
    } catch {
      showToast("Could not load API keys.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function generate() {
    if (!newName.trim()) return;

    try {
      const created = await createApiKey(newName.trim());
      setRawKey(created.key);
      setNewName("");
      showToast("API key created.", "success");
      await refresh();
    } catch {
      showToast("Could not create API key.", "error");
    }
  }

  async function confirmRevoke() {
    if (!revokeId) return;

    try {
      await revokeApiKey(revokeId);
      showToast("API key revoked.", "success");
      setRevokeId(null);
      await refresh();
    } catch {
      showToast("Could not revoke API key.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">API keys</h2>
      <p className="text-sm text-muted-foreground">Create keys for tools that need access to your documents.</p>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="text"
          placeholder="Key name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-64"
        />
        <Button onClick={generate}>Generate new key</Button>
      </div>

      {rawKey && (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>Copy this key now. You will not be able to view it again.</p>
            <code className="block bg-destructive/10 border border-destructive/30 rounded-md p-2 text-sm break-all">
              {rawKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(rawKey);
                showToast("Key copied.", "success");
              }}
            >
              Copy key
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>{key.name}</TableCell>
                <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setRevokeId(key.id)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(revokeId)}
        title="Revoke API key"
        message="This key will stop working immediately."
        confirmLabel="Revoke key"
        onConfirm={() => void confirmRevoke()}
        onCancel={() => setRevokeId(null)}
      />
    </div>
  );
}
