import { useCallback, useMemo } from "react";
import { toast } from "sonner";

type ToastKind = "success" | "error" | "info";

/**
 * Compatibility wrapper around sonner's toast API.
 * Provides the same `showToast(message, kind)` interface used
 * throughout the admin app.
 */
export function useToaster() {
  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    if (kind === "success") toast.success(message);
    else if (kind === "error") toast.error(message);
    else toast(message);
  }, []);

  return useMemo(() => ({ showToast }), [showToast]);
}

