import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] Event:", event, "Session:", session ? "exists" : "null");

      // Only synchronous updates here
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        // Defer any Supabase calls + navigation to avoid auth deadlocks
        setTimeout(async () => {
          try {
            const userId = session.user.id;

            const [adminRes, instructorRes] = await Promise.all([
              supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
              supabase.rpc("has_role", { _user_id: userId, _role: "instructor" }),
            ]);

            if (adminRes.error) throw adminRes.error;
            if (instructorRes.error) throw instructorRes.error;

            if (adminRes.data) {
              console.log("[Auth] Redirecting admin to dashboard");
              navigate("/dashboard");
              return;
            }

            if (instructorRes.data) {
              const { data: teacher, error: teacherError } = await supabase
                .from("teachers")
                .select("id")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (teacherError) throw teacherError;

              console.log("[Auth] Redirecting instructor to", teacher ? "dashboard" : "setup");
              navigate(teacher ? "/instructor-dashboard" : "/instructor-setup");
              return;
            }

            // Non-admin & non-instructor (student/user)
            const { data: pendingRequest, error: pendingError } = await supabase
              .from("instructor_requests")
              .select("status")
              .eq("user_id", userId)
              .eq("status", "pending")
              .limit(1)
              .maybeSingle();

            if (pendingError) throw pendingError;

            if (pendingRequest) {
              console.log("[Auth] User has pending instructor request, staying on login");
              navigate("/");
              return;
            }

            const { data: student, error: studentError } = await supabase
              .from("students")
              .select("id")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (studentError) throw studentError;

            console.log("[Auth] Redirecting student to", student ? "portal" : "setup");
            navigate(student ? "/student-portal" : "/student-setup");
          } catch (error) {
            console.error("[Auth] Error during post-login routing:", error);
            // Don't force logout; keep the session and send to a safe route.
            navigate("/dashboard");
          }
        }, 0);
      }

      if (event === "SIGNED_OUT") {
        console.log("[Auth] User signed out, clearing state and redirecting");
        setSession(null);
        setUser(null);
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] Initial session check:", session ? "exists" : "null");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      toast.success("Cadastro realizado! Faça login para continuar.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[SignOut] Starting logout process...');
    try {
      console.log('[SignOut] Calling supabase.auth.signOut');
      
      // Call Supabase signOut FIRST and WAIT for it to complete
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local state
      console.log('[SignOut] Clearing local state');
      setUser(null);
      setSession(null);
      
      // Clear localStorage
      localStorage.clear();
      
      // Force a complete page reload to "/" to ensure everything is cleaned
      console.log('[SignOut] Forcing page reload');
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('[SignOut] Exception during logout:', error);
      // Even on error, clear everything and force reload
      setUser(null);
      setSession(null);
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
