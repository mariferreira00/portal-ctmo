import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    academy: "Academia Dragon Fight",
    location: "São Paulo, SP",
    avatar: "CS",
    rating: 5,
    text: "Antes usávamos planilhas e cadernos. Com o Tatame, economizamos 10 horas por semana e nossos alunos adoram ver seu progresso no app."
  },
  {
    name: "Fernanda Oliveira",
    academy: "CT Guerreiros",
    location: "Rio de Janeiro, RJ",
    avatar: "FO",
    rating: 5,
    text: "O sistema de conquistas e ranking aumentou a frequência dos alunos em 40%. A gamificação realmente funciona!"
  },
  {
    name: "Roberto Santos",
    academy: "MMA Elite",
    location: "Belo Horizonte, MG",
    avatar: "RS",
    rating: 5,
    text: "Gerenciar 3 unidades era um pesadelo. Agora tenho tudo centralizado e consigo ver os relatórios de todas as academias em um lugar só."
  },
  {
    name: "Ana Costa",
    academy: "Escola de Judô Samurai",
    location: "Curitiba, PR",
    avatar: "AC",
    rating: 5,
    text: "O suporte é incrível! Sempre que preciso de ajuda, a resposta é rápida e eficiente. Recomendo para qualquer academia."
  }
];

export function Testimonials() {
  return (
    <section id="depoimentos" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            O que nossos clientes <span className="text-primary">dizem</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Academias de todo o Brasil já transformaram sua gestão com o Tatame.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-6 bg-card/50 border-border hover:border-primary/30 transition-all duration-300 relative"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 bg-primary/20 border border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.academy} • {testimonial.location}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
