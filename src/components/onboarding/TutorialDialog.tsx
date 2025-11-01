import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface TutorialDialogProps {
  open: boolean;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function TutorialDialog({
  open,
  currentStep,
  totalSteps,
  title,
  description,
  onNext,
  onPrevious,
  onSkip,
}: TutorialDialogProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Passo {currentStep + 1} de {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onSkip}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Pular
          </Button>

          <div className="flex gap-2 ml-auto">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={onPrevious}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}

            <Button onClick={onNext} className="gap-2">
              {isLastStep ? "Concluir" : "Próximo"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
