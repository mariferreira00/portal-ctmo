import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TutorialTooltipProps {
  open: boolean;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  targetElement?: string;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function TutorialTooltip({
  open,
  currentStep,
  totalSteps,
  title,
  description,
  targetElement,
  onNext,
  onPrevious,
  onSkip,
}: TutorialTooltipProps) {
  const [position, setPosition] = useState({ top: 20, left: 20 });
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    if (!open || !targetElement) {
      // Default position at top of screen
      setPosition({ top: 80, left: 20 });
      return;
    }

    const element = document.querySelector(targetElement);
    if (element) {
      const rect = element.getBoundingClientRect();
      const tooltipHeight = 200;
      
      // Position tooltip below the element
      let top = rect.bottom + 10;
      let left = Math.max(20, Math.min(rect.left, window.innerWidth - 340));
      
      // If tooltip would go below viewport, position above instead
      if (top + tooltipHeight > window.innerHeight) {
        top = Math.max(80, rect.top - tooltipHeight - 10);
      }
      
      setPosition({ top, left });
      
      // Scroll element into view smoothly
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setPosition({ top: 80, left: 20 });
    }
  }, [open, targetElement, currentStep]);

  if (!open) return null;

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
        onClick={onSkip}
      />
      
      {/* Highlight target element */}
      {targetElement && (() => {
        const element = document.querySelector(targetElement);
        if (element) {
          const rect = element.getBoundingClientRect();
          return (
            <div
              className="fixed border-2 border-primary rounded-lg pointer-events-none z-[45] transition-all duration-300"
              style={{
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
              }}
            />
          );
        }
        return null;
      })()}
      
      {/* Compact tooltip */}
      <Card
        className="fixed w-[calc(100vw-40px)] max-w-sm p-4 shadow-lg z-50 transition-all duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onSkip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-1" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{currentStep + 1} de {totalSteps}</span>
              <div className="flex gap-1">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Anterior
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={onNext}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {isLastStep ? "Concluir" : "Próximo"}
                  {!isLastStep && <ChevronRight className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
