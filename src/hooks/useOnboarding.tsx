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
    description: "Vamos fazer um tour completo pelos recursos.",
    navigationPath: "/student-portal",
  },
  {
    title: "Meu Portal",
    description: "Sua página inicial com progresso semanal.",
    targetElement: "[data-tutorial='weekly-progress']",
    navigationPath: "/student-portal",
  },
  {
    title: "Check-in nas Turmas",
    description: "Faça check-in antes das aulas.",
    targetElement: "[data-tutorial='enrolled-classes']",
    navigationPath: "/student-portal",
  },
  {
    title: "Conquistas",
    description: "Acompanhe suas medalhas e progresso.",
    targetElement: "[data-tutorial='sidebar-achievements']",
    navigationPath: "/achievements",
  },
  {
    title: "Feed de Treinos",
    description: "Veja fotos e interaja com sua turma.",
    targetElement: "[data-tutorial='sidebar-training']",
    navigationPath: "/training-feed",
  },
  {
    title: "Meu Perfil",
    description: "Gerencie suas informações pessoais.",
    targetElement: "[data-tutorial='sidebar-profile']",
    navigationPath: "/student-profile",
  },
];

const instructorTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel do Instrutor! 👨‍🏫",
    description: "Tour completo pelas ferramentas de gestão.",
    navigationPath: "/instructor-dashboard",
  },
  {
    title: "Dashboard",
    description: "Visão geral das suas turmas e alunos.",
    targetElement: "[data-tutorial='stats']",
    navigationPath: "/instructor-dashboard",
  },
  {
    title: "Suas Turmas Resumo",
    description: "Veja o resumo das suas turmas.",
    targetElement: "[data-tutorial='instructor-classes']",
    navigationPath: "/instructor-dashboard",
  },
  {
    title: "Minhas Turmas",
    description: "Registre presenças e gerencie alunos.",
    targetElement: "[data-tutorial='sidebar-classes']",
    navigationPath: "/classes",
  },
  {
    title: "Relatórios",
    description: "Acesse relatórios de frequência.",
    targetElement: "[data-tutorial='sidebar-instructor-reports']",
    navigationPath: "/instructor-reports",
  },
  {
    title: "Feed de Treinos",
    description: "Poste fotos e interaja com alunos.",
    targetElement: "[data-tutorial='sidebar-training']",
    navigationPath: "/training-feed",
  },
  {
    title: "Meu Perfil",
    description: "Gerencie suas informações.",
    targetElement: "[data-tutorial='sidebar-instructor-profile']",
    navigationPath: "/instructor-profile",
  },
];

const adminTutorial: TutorialStep[] = [
  {
    title: "Bem-vindo ao Painel Admin! ⚙️",
    description: "Tour completo pelas ferramentas.",
    navigationPath: "/dashboard",
  },
  {
    title: "Dashboard",
    description: "Estatísticas gerais do sistema.",
    targetElement: "[data-tutorial='admin-stats']",
    navigationPath: "/dashboard",
  },
  {
    title: "Professores",
    description: "Gerencie o cadastro de professores.",
    targetElement: "[data-tutorial='sidebar-teachers']",
    navigationPath: "/teachers",
  },
  {
    title: "Turmas",
    description: "Crie e organize turmas.",
    targetElement: "[data-tutorial='sidebar-classes']",
    navigationPath: "/classes",
  },
  {
    title: "Alunos",
    description: "Gerencie o cadastro de alunos.",
    targetElement: "[data-tutorial='sidebar-students']",
    navigationPath: "/students",
  },
  {
    title: "Frequência",
    description: "Acompanhe a frequência geral.",
    targetElement: "[data-tutorial='sidebar-attendance']",
    navigationPath: "/attendance",
  },
  {
    title: "Usuários",
    description: "Gerencie permissões de usuários.",
    targetElement: "[data-tutorial='sidebar-users']",
    navigationPath: "/users",
  },
  {
    title: "Relatórios",
    description: "Relatórios completos e análises.",
    targetElement: "[data-tutorial='sidebar-reports']",
    navigationPath: "/admin-reports",
  },
  {
    title: "Solicitações de Turma",
    description: "Gerencie solicitações de matrículas.",
    targetElement: "[data-tutorial='sidebar-enrollment-requests']",
    navigationPath: "/enrollment-requests",
  },
  {
    title: "Solicitações de Instrutor",
    description: "Aprove novos instrutores.",
    targetElement: "[data-tutorial='sidebar-instructor-requests']",
    navigationPath: "/instructor-requests",
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
