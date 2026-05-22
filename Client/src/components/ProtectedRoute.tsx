import React from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setAuthenticated(Boolean(session));
      setLoading(false);
    }

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!authenticated) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <>{children}</>;
}