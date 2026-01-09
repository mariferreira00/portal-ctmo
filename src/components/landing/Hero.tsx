import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(0_84%_50%_/_0.15),transparent_50%)]" />
      
      {/* Decorative grid pattern (tatame lines) */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(0 84% 50% / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(0 84% 50% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-40 right-20 w-32 h-32 rounded-full bg-primary/15 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Badge variant="outline" className="mb-6 border-primary/50 bg-primary/10 text-primary px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Plataforma #1 para Academias de Artes Marciais
          </Badge>
        </div>

        {/* Main headline */}
        <h1 className="animate-slide-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight" style={{ animationDelay: '0.2s' }}>
          Gerencie sua academia
          <br />
          <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(0_84%_50%_/_0.5)]">
            com excelência
          </span>
        </h1>

        {/* Subheadline */}
        <p className="animate-slide-up text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8" style={{ animationDelay: '0.3s' }}>
          Controle de alunos, presença, aulas, pagamentos e muito mais. 
          Tudo em uma plataforma moderna e fácil de usar.
        </p>

        {/* CTAs */}
        <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center mb-8" style={{ animationDelay: '0.4s' }}>
          <Button 
            asChild 
            size="lg" 
            className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-[0_0_30px_hsl(0_84%_50%_/_0.4)] hover:shadow-[0_0_50px_hsl(0_84%_50%_/_0.6)] transition-all group"
          >
            <Link to="/criar-academia">
              Comece Grátis
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto text-lg px-8 py-6 border-border hover:bg-secondary/50"
          >
            <Play className="w-5 h-5 mr-2" />
            Ver Demonstração
          </Button>
        </div>

        {/* Trust badges */}
        <div className="animate-slide-up flex flex-wrap gap-6 justify-center items-center text-sm text-muted-foreground" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>14 dias grátis</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Cancele quando quiser</span>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-slide-up mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto" style={{ animationDelay: '0.6s' }}>
          {[
            { number: "500+", label: "Academias" },
            { number: "50k+", label: "Alunos" },
            { number: "1M+", label: "Check-ins" },
            { number: "99.9%", label: "Uptime" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
}
