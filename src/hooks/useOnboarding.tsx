import { useState, useEffect } from "react";
import { UserRole } from "./useUserRole";

export interface TutorialStep {
  title: string;
  description: string;
  targetElement?: string;
  action?: () => void;
  navigationPath?: string;
}

const studentTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Portal do Aluno! 🥋",
    description: "Vamos fazer um tour rápido pelos principais recursos.",
    navigationPath: "/student-portal",
  },
  {
    title: "Progresso Semanal",
    description: "Acompanhe suas presenças e defina sua meta.",
    targetElement: "[data-tutorial='weekly-progress']",
    navigationPath: "/student-portal",
  },
  {
    title: "Suas Turmas",
    description: "Faça check-in aqui antes das aulas.",
    targetElement: "[data-tutorial='enrolled-classes']",
    navigationPath: "/student-portal",
  },
  {
    title: "Feed de Treinos",
    description: "Veja fotos e posts da sua turma aqui.",
    targetElement: "[data-tutorial='sidebar-training']",
    navigationPath: "/training-feed",
  },
  {
    title: "Conquistas",
    description: "Acompanhe suas medalhas e progresso.",
    targetElement: "[data-tutorial='sidebar-achievements']",
    navigationPath: "/achievements",
  },
];

const instructorTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel do Instrutor! 👨‍🏫",
    description: "Tour rápido pelas suas ferramentas de gestão.",
    navigationPath: "/instructor-dashboard",
  },
  {
    title: "Estatísticas",
    description: "Acompanhe turmas e presenças aqui.",
    targetElement: "[data-tutorial='stats']",
    navigationPath: "/instructor-dashboard",
  },
  {
    title: "Suas Turmas",
    description: "Veja suas turmas e alunos matriculados.",
    targetElement: "[data-tutorial='instructor-classes']",
    navigationPath: "/instructor-dashboard",
  },
  {
    title: "Gerenciar Turmas",
    description: "Registre presenças e acompanhe alunos.",
    targetElement: "[data-tutorial='sidebar-classes']",
    navigationPath: "/classes",
  },
  {
    title: "Feed de Treinos",
    description: "Poste fotos e interaja com alunos.",
    targetElement: "[data-tutorial='sidebar-training']",
    navigationPath: "/training-feed",
  },
];

const adminTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel Admin! ⚙️",
    description: "Tour rápido pelas ferramentas de gestão.",
    navigationPath: "/dashboard",
  },
  {
    title: "Estatísticas Gerais",
    description: "Visão geral de alunos, professores e turmas.",
    targetElement: "[data-tutorial='admin-stats']",
    navigationPath: "/dashboard",
  },
  {
    title: "Gerenciar Usuários",
    description: "Crie e gerencie contas de usuários.",
    targetElement: "[data-tutorial='sidebar-users']",
    navigationPath: "/users",
  },
  {
    title: "Turmas",
    description: "Organize turmas e matrículas.",
    targetElement: "[data-tutorial='sidebar-classes']",
    navigationPath: "/classes",
  },
  {
    title: "Relatórios",
    description: "Acesse relatórios completos aqui.",
    targetElement: "[data-tutorial='sidebar-reports']",
    navigationPath: "/admin-reports",
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
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      
      // Execute action if exists
      const nextStepData = steps[nextStepIndex];
      if (nextStepData.action) {
        setTimeout(() => nextStepData.action!(), 300);
      }
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
