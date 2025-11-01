import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { TutorialTooltip } from "./TutorialTooltip";
import { TutorialFloatingButton } from "./TutorialFloatingButton";
import { useOnboarding } from "@/hooks/useOnboarding";
import { UserRole } from "@/hooks/useUserRole";

interface TutorialManagerProps {
  userRole: UserRole;
}

export function TutorialManager({ userRole }: TutorialManagerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpen } = useSidebar();
  
  const {
    showTutorial,
    currentStep,
    steps,
    showFloatingButton,
    nextStep,
    previousStep,
    skipTutorial,
    restartTutorial,
  } = useOnboarding(userRole);

  const currentStepData = steps[currentStep];

  // Handle navigation and sidebar when step changes
  useEffect(() => {
    if (!showTutorial || !currentStepData) return;

    // Navigate to the required path if different from current
    if (currentStepData.navigationPath && location.pathname !== currentStepData.navigationPath) {
      navigate(currentStepData.navigationPath);
    }

    // Open sidebar if targeting a sidebar element
    if (currentStepData.targetElement?.includes('sidebar')) {
      setOpen(true);
    }
  }, [currentStep, showTutorial, currentStepData, navigate, location.pathname, setOpen]);

  return (
    <>
      {showFloatingButton && (
        <TutorialFloatingButton onClick={restartTutorial} />
      )}
      
      {showTutorial && currentStepData && (
        <TutorialTooltip
          open={showTutorial}
          currentStep={currentStep}
          totalSteps={steps.length}
          title={currentStepData.title}
          description={currentStepData.description}
          targetElement={currentStepData.targetElement}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipTutorial}
        />
      )}
    </>
  );
}
