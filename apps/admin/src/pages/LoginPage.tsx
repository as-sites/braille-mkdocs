import { Navigate, useNavigate } from "react-router";

import { LoginForm } from "../components/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <LoginForm
        onSuccess={() => {
          void refresh().finally(() => {
            navigate("/");
          });
        }}
      />
    </main>
  );
}
