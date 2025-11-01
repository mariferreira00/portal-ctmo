import { useState, useEffect } from "react";
import { UserRole } from "./useUserRole";

export interface TutorialStep {
  title: string;
  description: string;
  targetElement?: string;
}

const studentTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Portal do Aluno! 🥋",
    description: "Vamos fazer um tour rápido pelos principais recursos.",
  },
  {
    title: "Progresso Semanal",
    description: "Acompanhe suas presenças e defina sua meta.",
    targetElement: "[data-tutorial='weekly-progress']",
  },
  {
    title: "Suas Turmas",
    description: "Faça check-in aqui antes das aulas.",
    targetElement: "[data-tutorial='enrolled-classes']",
  },
  {
    title: "Feed de Treinos",
    description: "Acesse pelo menu para ver fotos e posts.",
    targetElement: "[data-tutorial='sidebar-training']",
  },
  {
    title: "Conquistas",
    description: "Confira suas medalhas no menu.",
    targetElement: "[data-tutorial='sidebar-achievements']",
  },
];

const instructorTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel do Instrutor! 👨‍🏫",
    description: "Tour rápido pelas suas ferramentas de gestão.",
  },
  {
    title: "Estatísticas",
    description: "Acompanhe turmas e presenças aqui.",
    targetElement: "[data-tutorial='stats']",
  },
  {
    title: "Suas Turmas",
    description: "Veja suas turmas e alunos matriculados.",
    targetElement: "[data-tutorial='instructor-classes']",
  },
  {
    title: "Menu de Turmas",
    description: "Acesse pelo menu para registrar presenças.",
    targetElement: "[data-tutorial='sidebar-classes']",
  },
  {
    title: "Feed de Treinos",
    description: "Poste fotos e interaja com alunos.",
    targetElement: "[data-tutorial='sidebar-training']",
  },
];

const adminTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel Admin! ⚙️",
    description: "Tour rápido pelas ferramentas de gestão.",
  },
  {
    title: "Estatísticas Gerais",
    description: "Visão geral de alunos, professores e turmas.",
    targetElement: "[data-tutorial='admin-stats']",
  },
  {
    title: "Gerenciar Usuários",
    description: "Crie e gerencie contas no menu.",
    targetElement: "[data-tutorial='sidebar-users']",
  },
  {
    title: "Turmas",
    description: "Organize turmas e matrículas.",
    targetElement: "[data-tutorial='sidebar-classes']",
  },
  {
    title: "Relatórios",
    description: "Acesse relatórios completos no menu.",
    targetElement: "[data-tutorial='sidebar-reports']",
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
