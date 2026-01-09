import { Building2, UserPlus, LineChart } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Crie sua academia",
    description: "Configure seu espaço em menos de 5 minutos. Adicione modalidades, horários e personalize com suas cores."
  },
  {
    number: "02",
    icon: UserPlus,
    title: "Adicione sua equipe",
    description: "Convide instrutores e cadastre alunos. Cada um com seu próprio acesso e permissões."
  },
  {
    number: "03",
    icon: LineChart,
    title: "Acompanhe tudo",
    description: "Monitore presença, evolução dos alunos e métricas do negócio em tempo real."
  }
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Comece em <span className="text-primary">3 passos simples</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De zero a operacional em minutos. Sem complicação, sem burocracia.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-[60%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative text-center group"
              >
                {/* Step number badge */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-6 group-hover:scale-110 group-hover:shadow-[0_0_40px_hsl(0_84%_50%_/_0.3)] transition-all duration-300">
                  <span className="text-3xl font-black text-primary">{step.number}</span>
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary/50 transition-colors">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {step.description}
                </p>

                {/* Vertical connector (mobile) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden w-0.5 h-8 bg-gradient-to-b from-primary/30 to-transparent mx-auto mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
