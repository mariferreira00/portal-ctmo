import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "admin" | "instructor" | "user";

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRoles() {
      if (!user) {
        if (!cancelled) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const [adminRes, instructorRes] = await Promise.all([
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: user.id, _role: "instructor" }),
        ]);

        if (adminRes.error) throw adminRes.error;
        if (instructorRes.error) throw instructorRes.error;

        const nextRoles: UserRole[] = [];
        if (adminRes.data) nextRoles.push("admin");
        if (instructorRes.data) nextRoles.push("instructor");
        if (nextRoles.length === 0) nextRoles.push("user");

        if (!cancelled) setRoles(nextRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        // Safe fallback: treat as regular user so the app still works.
        if (!cancelled) setRoles(["user"]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRoles();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasRole = (role: UserRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isInstructor = hasRole("instructor");

  return { roles, hasRole, isAdmin, isInstructor, loading };
}
