import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "Para academias iniciantes",
    monthlyPrice: 97,
    yearlyPrice: 970,
    popular: false,
    features: [
      "Até 50 alunos",
      "3 instrutores",
      "5 modalidades",
      "Controle de presença",
      "Feed de treinos",
      "Suporte por email",
    ],
    notIncluded: [
      "Domínio customizado",
      "Relatórios avançados",
      "API & Integrações"
    ]
  },
  {
    name: "Pro",
    description: "Para academias em crescimento",
    monthlyPrice: 197,
    yearlyPrice: 1970,
    popular: true,
    features: [
      "Até 200 alunos",
      "10 instrutores",
      "15 modalidades",
      "Controle de presença",
      "Feed de treinos",
      "Suporte prioritário",
      "Domínio customizado",
      "Relatórios avançados",
      "Múltiplas unidades",
    ],
    notIncluded: [
      "API & Integrações"
    ]
  },
  {
    name: "Enterprise",
    description: "Para redes e franquias",
    monthlyPrice: 497,
    yearlyPrice: 4970,
    popular: false,
    features: [
      "Alunos ilimitados",
      "Instrutores ilimitados",
      "Modalidades ilimitadas",
      "Controle de presença",
      "Feed de treinos",
      "Suporte dedicado 24/7",
      "Domínio customizado",
      "Relatórios avançados",
      "Múltiplas unidades",
      "API & Integrações",
      "Onboarding personalizado",
    ],
    notIncluded: []
  }
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="precos" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Planos que <span className="text-primary">cabem no seu bolso</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Comece grátis por 14 dias. Sem cartão de crédito. Cancele quando quiser.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isYearly && (
              <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary ml-2">
                2 meses grátis
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative p-6 lg:p-8 bg-card/50 border-border transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-[0_0_40px_hsl(0_84%_50%_/_0.2)] scale-105 lg:scale-110' 
                  : 'hover:border-primary/50 hover-lift'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg text-muted-foreground">R$</span>
                  <span className="text-5xl font-black text-foreground">
                    {isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Cobrado R$ {plan.yearlyPrice}/ano
                  </p>
                )}
              </div>

              <Button 
                asChild
                className={`w-full mb-6 ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90 shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <Link to="/criar-academia">
                  Começar Trial Grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 opacity-50">
                    <Check className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground line-through">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem 14 dias de trial grátis. Sem compromisso.
        </p>
      </div>
    </section>
  );
}
