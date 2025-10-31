import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { toast } from "sonner";

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

        await signUp(result.data.email, result.data.password, result.data.fullName);
        setIsSignUp(false);
        setEmail("");
        setPassword("");
        setFullName("");
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full mb-3 sm:mb-4 shadow-[0_0_30px_hsl(0_84%_50%_/_0.3)]">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-primary">Portal</span>
            <span className="text-foreground"> CTMO</span>
          </h1>
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
                <Label htmlFor="password" className="text-foreground">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
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
