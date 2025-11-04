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
      // Clear local state FIRST to prevent any redirects
      console.log('[SignOut] Clearing local state');
      setUser(null);
      setSession(null);
      
      // Clear any localStorage items that might be causing issues
      localStorage.removeItem('supabase.auth.token');
      
      // Then call Supabase signOut (this will trigger SIGNED_OUT event)
      console.log('[SignOut] Calling supabase.auth.signOut');
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      // Navigate after clearing state
      console.log('[SignOut] Navigating to /');
      navigate("/");
      
      // Only show error if it's not a "session missing" error
      if (error && !error.message.includes('session')) {
        console.error("Logout error:", error);
        toast.error("Erro ao fazer logout, mas você foi desconectado localmente");
      } else {
        toast.success("Logout realizado com sucesso!");
      }
    } catch (error: any) {
      console.error('[SignOut] Exception during logout:', error);
      // Even on error, clear local state and redirect
      setUser(null);
      setSession(null);
      navigate("/");
      
      // Only show error toast if it's not a session-related error
      if (!error.message?.includes('session')) {
        toast.error(error.message || "Erro ao fazer logout");
      } else {
        toast.success("Você foi desconectado!");
      }
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
