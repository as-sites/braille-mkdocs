import { toast } from "sonner";

type ToastKind = "success" | "error" | "info";

/**
 * Compatibility wrapper around sonner's toast API.
 * Provides the same `showToast(message, kind)` interface used
 * throughout the admin app.
 */
export function useToaster() {
  return {
    showToast(message: string, kind: ToastKind = "info") {
      if (kind === "success") toast.success(message);
      else if (kind === "error") toast.error(message);
      else toast(message);
    },
  };
}

/**
 * @deprecated — no longer needed. <Toaster /> from sonner is rendered in App.tsx.
 * Kept for import compatibility during migration.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
