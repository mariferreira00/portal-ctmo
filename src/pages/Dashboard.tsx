import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOnboarding } from "@/hooks/useOnboarding";
import { TutorialTooltip } from "@/components/onboarding/TutorialTooltip";
import { TutorialFloatingButton } from "@/components/onboarding/TutorialFloatingButton";

const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });

  const {
    showTutorial,
    currentStep,
    steps,
    showFloatingButton,
    nextStep,
    previousStep,
    skipTutorial,
    restartTutorial,
  } = useOnboarding("admin");

  useEffect(() => {
    async function fetchStats() {
      const [s, t, c] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
      ]);
      setStats({ students: s.count || 0, teachers: t.count || 0, classes: c.count || 0 });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      {showFloatingButton && (
        <TutorialFloatingButton onClick={restartTutorial} />
      )}
      
      {showTutorial && steps[currentStep] && (
        <TutorialTooltip
          open={showTutorial}
          currentStep={currentStep}
          totalSteps={steps.length}
          title={steps[currentStep].title}
          description={steps[currentStep].description}
          targetElement={steps[currentStep].targetElement}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipTutorial}
        />
      )}

      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard Portal CTMO</h1>
        <p className="text-sm md:text-base text-muted-foreground">Visão geral do centro de treinamento</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" data-tutorial="admin-stats">
        {[
          { title: "Total de Alunos", value: stats.students, icon: Users },
          { title: "Professores", value: stats.teachers, icon: GraduationCap },
          { title: "Turmas Ativas", value: stats.classes, icon: UserCheck },
        ].map((stat, i) => (
          <Card key={i} className="p-6 hover:border-primary transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
