import { useState, useEffect } from "react";
import { UserRole } from "./useUserRole";

export interface TutorialStep {
  title: string;
  description: string;
  target?: string;
}

const studentTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Portal do Aluno! 🥋",
    description: "Vamos fazer um tour rápido para você conhecer todos os recursos disponíveis.",
  },
  {
    title: "Progresso Semanal",
    description: "Aqui você acompanha suas presenças na semana e pode definir sua meta pessoal de treinos.",
  },
  {
    title: "Feed de Treinos",
    description: "Veja as fotos e posts de treinos da sua turma, comente e reaja às postagens.",
  },
  {
    title: "Conquistas",
    description: "Acompanhe suas conquistas e desbloqueie novas medalhas conforme você treina!",
  },
  {
    title: "Seu Perfil",
    description: "No menu lateral você pode acessar e editar suas informações pessoais.",
  },
];

const instructorTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel do Instrutor! 👨‍🏫",
    description: "Vamos conhecer as ferramentas disponíveis para você gerenciar suas turmas.",
  },
  {
    title: "Visão Geral",
    description: "Aqui você vê estatísticas das suas turmas, presenças recentes e muito mais.",
  },
  {
    title: "Gerenciar Turmas",
    description: "Acesse suas turmas pelo menu lateral para registrar presenças e acompanhar alunos.",
  },
  {
    title: "Feed de Treinos",
    description: "Poste fotos dos treinos, acompanhe as publicações e interaja com seus alunos.",
  },
  {
    title: "Relatórios",
    description: "Acesse relatórios detalhados de frequência e desempenho dos seus alunos.",
  },
];

const adminTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel Administrativo! ⚙️",
    description: "Aqui você tem controle total sobre o sistema e todos os usuários.",
  },
  {
    title: "Gerenciar Usuários",
    description: "Crie e gerencie contas de alunos, instrutores e outros administradores.",
  },
  {
    title: "Turmas e Matrículas",
    description: "Organize turmas, horários e gerencie matrículas de alunos.",
  },
  {
    title: "Relatórios Completos",
    description: "Acesse relatórios financeiros, de frequência e estatísticas gerais do sistema.",
  },
  {
    title: "Configurações",
    description: "Configure opções gerais do sistema e personalize o funcionamento da plataforma.",
  },
];

export function useOnboarding(userRole: UserRole | null) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const getTutorialSteps = (): TutorialStep[] => {
    if (!userRole) return [];
    
    if (userRole === "admin") return adminTutorial;
    if (userRole === "instructor") return instructorTutorial;
    return studentTutorial;
  };

  const steps = getTutorialSteps();

  useEffect(() => {
    if (!userRole) return;

    const hasSeenTutorial = localStorage.getItem(`tutorial-seen-${userRole}`);
    
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      setShowFloatingButton(false);
    } else {
      setShowFloatingButton(true);
    }
  }, [userRole]);

  const skipTutorial = () => {
    if (userRole) {
      localStorage.setItem(`tutorial-seen-${userRole}`, "true");
    }
    setShowTutorial(false);
    setShowFloatingButton(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      skipTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setShowTutorial(true);
    setShowFloatingButton(false);
  };

  return {
    showTutorial,
    currentStep,
    steps,
    showFloatingButton,
    nextStep,
    previousStep,
    skipTutorial,
    restartTutorial,
  };
}
