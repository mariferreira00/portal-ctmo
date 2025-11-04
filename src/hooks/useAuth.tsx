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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Event:', event, 'Session:', session ? 'exists' : 'null');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === "SIGNED_IN" && session?.user) {
          console.log('[Auth] User signed in, checking role...');
          // Defer navigation to avoid blocking auth state updates
          setTimeout(async () => {
            try {
              // Check user role and redirect accordingly
              const { data: roles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id);
              
              const isAdmin = roles?.some(r => r.role === "admin");
              const isInstructor = roles?.some(r => r.role === "instructor");
              
              if (isAdmin) {
                console.log('[Auth] Redirecting admin to dashboard');
                navigate("/dashboard");
              } else if (isInstructor) {
                // Check if instructor has teacher profile
                const { data: teacher } = await supabase
                  .from("teachers")
                  .select("id")
                  .eq("user_id", session.user.id)
                  .maybeSingle();
                
                console.log('[Auth] Redirecting instructor to', teacher ? 'dashboard' : 'setup');
                navigate(teacher ? "/instructor-dashboard" : "/instructor-setup");
              } else {
                // Check for pending instructor request - don't redirect if pending
                const { data: pendingRequest } = await supabase
                  .from("instructor_requests")
                  .select("status")
                  .eq("user_id", session.user.id)
                  .eq("status", "pending")
                  .maybeSingle();

                if (pendingRequest) {
                  // User has pending instructor request, stay on login page
                  console.log('[Auth] User has pending request, staying on login');
                  navigate("/");
                  return;
                }

                // Regular user - check for student profile
                const { data: student } = await supabase
                  .from("students")
                  .select("id")
                  .eq("user_id", session.user.id)
                  .maybeSingle();
                
                console.log('[Auth] Redirecting student to', student ? 'portal' : 'setup');
                navigate(student ? "/student-portal" : "/student-setup");
              }
            } catch (error) {
              console.error("Error checking user role:", error);
              // Force logout on error
              await supabase.auth.signOut();
              navigate("/");
            }
          }, 0);
        }
        
        if (event === "SIGNED_OUT") {
          console.log('[Auth] User signed out, clearing state and redirecting');
          setSession(null);
          setUser(null);
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session check:', session ? 'exists' : 'null');
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
