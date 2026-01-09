import { 
  Users, 
  CalendarCheck, 
  Clock, 
  Camera, 
  Trophy, 
  BarChart3,
  Smartphone,
  CreditCard,
  Bell
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Gestão de Alunos",
    description: "Cadastro completo, graduações, histórico de treinos e evolução de cada aluno."
  },
  {
    icon: CalendarCheck,
    title: "Controle de Presença",
    description: "Check-in digital com QR Code, relatórios de frequência e metas semanais."
  },
  {
    icon: Clock,
    title: "Grade de Aulas",
    description: "Horários, modalidades, instrutores e capacidade máxima por turma."
  },
  {
    icon: Camera,
    title: "Feed de Treinos",
    description: "Rede social interna para compartilhar fotos, conquistas e interagir com a comunidade."
  },
  {
    icon: Trophy,
    title: "Ranking e Gamificação",
    description: "Sistema de pontuação semanal, conquistas e achievements para motivar os alunos."
  },
  {
    icon: BarChart3,
    title: "Relatórios Completos",
    description: "Métricas de presença, evolução, receitas e insights para crescer seu negócio."
  },
  {
    icon: Smartphone,
    title: "100% Mobile",
    description: "Interface otimizada para celular. Seus alunos acessam de qualquer lugar."
  },
  {
    icon: CreditCard,
    title: "Controle Financeiro",
    description: "Mensalidades, inadimplência e relatórios financeiros em um só lugar."
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Avisos automáticos de vencimento, comunicados e lembretes de aula."
  }
];

export function Features() {
  return (
    <section id="funcionalidades" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa para
            <span className="text-primary"> gerenciar sua academia</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas e fáceis de usar para automatizar sua gestão e focar no que importa: seus alunos.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 bg-card/50 border-border hover:border-primary/50 hover-lift group transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
