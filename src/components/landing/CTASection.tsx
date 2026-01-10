import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(0_84%_50%_/_0.2),transparent_70%)]" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-primary/15 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Sparkles badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Comece hoje mesmo</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6">
            Pronto para revolucionar
            <br />
            <span className="text-primary">sua academia?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se a centenas de academias que já transformaram sua gestão. 
            Comece grátis e veja os resultados.
          </p>

          {/* CTA Button */}
          <Button 
            asChild
            size="lg"
            className="text-lg px-10 py-7 bg-primary hover:bg-primary/90 shadow-[0_0_50px_hsl(0_84%_50%_/_0.5)] hover:shadow-[0_0_70px_hsl(0_84%_50%_/_0.7)] animate-glow transition-all group"
          >
            <Link to="/criar-academia">
              Começar Agora — Grátis por 7 dias
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          {/* Trust text */}
          <p className="text-sm text-muted-foreground mt-6">
            Sem cartão de crédito • Sem compromisso • Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
