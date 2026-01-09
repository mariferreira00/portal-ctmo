import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o período de teste gratuito?",
    answer: "Você tem 14 dias para testar todas as funcionalidades do plano escolhido, sem precisar cadastrar cartão de crédito. Ao final do período, você pode assinar ou simplesmente parar de usar."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não há fidelidade ou multa. Você pode cancelar sua assinatura a qualquer momento diretamente no painel de configurações."
  },
  {
    question: "Como migro meus dados de outro sistema?",
    answer: "Oferecemos migração assistida gratuita para todos os planos. Nossa equipe ajuda você a importar alunos, instrutores e histórico de presença."
  },
  {
    question: "Tem aplicativo para celular?",
    answer: "O Tatame é 100% responsivo e funciona perfeitamente no navegador do celular. Seus alunos podem acessar, fazer check-in e ver seu progresso de qualquer dispositivo."
  },
  {
    question: "Como funciona o domínio customizado?",
    answer: "Nos planos Pro e Enterprise, você pode usar seu próprio domínio (ex: app.suaacademia.com.br). Fornecemos as instruções e suporte para configuração do DNS."
  },
  {
    question: "Quantos usuários posso ter?",
    answer: "O limite varia por plano: Starter até 50 alunos, Pro até 200 alunos, e Enterprise é ilimitado. Instrutores e administradores têm limites separados."
  },
  {
    question: "Como funciona o suporte?",
    answer: "Starter tem suporte por email (resposta em até 24h). Pro tem suporte prioritário via chat (resposta em até 4h). Enterprise tem suporte dedicado 24/7 com gerente de conta."
  },
  {
    question: "Posso personalizar as cores e logo?",
    answer: "Sim! Todos os planos permitem personalizar logo e cores da sua academia. O sistema aplica automaticamente sua identidade visual em toda a plataforma."
  },
  {
    question: "Os dados dos meus alunos estão seguros?",
    answer: "Absolutamente. Usamos criptografia de ponta a ponta, backups automáticos diários e nossos servidores seguem os mais altos padrões de segurança (ISO 27001)."
  },
  {
    question: "Posso gerenciar múltiplas unidades?",
    answer: "Sim, nos planos Pro e Enterprise. Você pode gerenciar várias academias em um único painel, com relatórios consolidados e permissões por unidade."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Perguntas <span className="text-primary">Frequentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma. Não encontrou o que procura? Entre em contato!
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 bg-card/30 data-[state=open]:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
