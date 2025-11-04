import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import ctmoLogo from "@/assets/ctmo-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

// Schema de validação
const signUpSchema = z.object({
  fullName: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "Email muito longo")
    .toLowerCase()
    .refine((email) => {
      // Bloquear emails temporários/descartáveis
      const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com'];
      const domain = email.split('@')[1];
      return !disposableDomains.includes(domain);
    }, "Por favor, use um email válido"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(100, "Senha muito longa")
    .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve ter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve ter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Senha deve ter pelo menos um caractere especial")
});

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "Senha obrigatória")
});

const Index = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [wantsInstructor, setWantsInstructor] = useState(false);
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Calcular força da senha em tempo real
  useEffect(() => {
    if (!isSignUp || !password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }, [password, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        // Validar dados de cadastro
        const result = signUpSchema.safeParse({ fullName, email, password });
        
        if (!result.success) {
          const fieldErrors: { [key: string]: string } = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          toast.error("Preencha todos os campos corretamente");
          setLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: result.data.fullName,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        // If user wants to be an instructor, create a request immediately
        if (wantsInstructor && signUpData.user) {
          const { error: requestError } = await supabase
            .from('instructor_requests')
            .insert({ 
              user_id: signUpData.user.id,
              email: result.data.email 
            });
          
          if (requestError) {
            console.error('Error creating instructor request:', requestError);
            toast.error("Erro ao criar solicitação de instrutor");
          } else {
            // Sign out immediately to prevent automatic redirect
            await supabase.auth.signOut();
            
            toast.success(
              "Sua solicitação foi enviada para o administrador. Você será notificado por email quando for aprovado.",
              { duration: 8000 }
            );
            
            // Reset form and stay on login screen
            setIsSignUp(false);
            setEmail("");
            setPassword("");
            setFullName("");
            setWantsInstructor(false);
            setLoading(false);
            return;
          }
        } else {
          toast.success("Cadastro realizado! Faça login para continuar.");
        }
        
        setIsSignUp(false);
        setEmail("");
        setPassword("");
        setFullName("");
        setWantsInstructor(false);
      } else {
        // Validar login
        const result = signInSchema.safeParse({ email, password });
        
        if (!result.success) {
          const fieldErrors: { [key: string]: string } = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          toast.error("Credenciais inválidas");
          setLoading(false);
          return;
        }

        await signIn(result.data.email, result.data.password);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const emailSchema = z.string().email("Email inválido");
      const result = emailSchema.safeParse(resetEmail);

      if (!result.success) {
        toast.error("Por favor, insira um email válido");
        setResetLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(result.data, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
      setResetEmail("");
      setResetDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de redefinição");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
            <img 
              src={ctmoLogo} 
              alt="CTMO Logo" 
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Centro de Treinamento Marcial de Olinda
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 bg-card border-border shadow-[0_0_40px_hsl(0_84%_50%_/_0.15)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-center text-foreground">
                {isSignUp ? "Criar Conta" : "Acessar Sistema"}
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                {isSignUp ? "Cadastre-se no sistema" : "Entre com suas credenciais"}
              </p>
            </div>

            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    className={`bg-background border-border focus:border-primary ${
                      errors.fullName ? "border-destructive" : ""
                    }`}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrors(prev => ({ ...prev, fullName: "" }));
                    }}
                  />
                  {errors.fullName && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.fullName}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className={`bg-background border-border focus:border-primary ${
                    errors.email ? "border-destructive" : ""
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: "" }));
                  }}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">
                    Senha
                  </Label>
                  {!isSignUp && (
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Redefinir Senha</DialogTitle>
                          <DialogDescription>
                            Digite seu email para receber um link de redefinição de senha.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setResetDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={resetLoading}>
                              {resetLoading ? "Enviando..." : "Enviar Email"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  className={`bg-background border-border focus:border-primary ${
                    errors.password ? "border-destructive" : ""
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: "" }));
                  }}
                />
                {errors.password && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
                
                {/* Indicador de força da senha */}
                {isSignUp && password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength
                              ? passwordStrength <= 2
                                ? "bg-destructive"
                                : passwordStrength <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength <= 2 && "Senha fraca"}
                      {passwordStrength === 3 && "Senha média"}
                      {passwordStrength === 4 && "Senha boa"}
                      {passwordStrength === 5 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Senha forte
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {isSignUp && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instructor"
                    checked={wantsInstructor}
                    onCheckedChange={(checked) => setWantsInstructor(checked === true)}
                  />
                  <label
                    htmlFor="instructor"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Criar conta de instrutor
                  </label>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)] hover:shadow-[0_0_30px_hsl(0_84%_50%_/_0.5)] transition-all"
              size="lg"
              disabled={loading}
            >
              {loading ? "Carregando..." : isSignUp ? "Cadastrar" : "Entrar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Já tem conta? Entrar" : "Criar nova conta"}
              </button>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Portal CTMO • Acesso restrito
        </p>
      </div>
    </div>
  );
};

export default Index;
