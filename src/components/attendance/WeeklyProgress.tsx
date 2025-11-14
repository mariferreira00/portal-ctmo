import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WeeklyProgressProps {
  checkIns: Array<{ checked_in_at: string; class_name: string }>;
  weeklyGoal?: number;
}

export function WeeklyProgress({ checkIns, weeklyGoal = 7 }: WeeklyProgressProps) {
  const today = new Date();
  
  // Encontrar a segunda-feira da semana atual
  const getMondayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const diff = day === 0 ? -6 : 1 - day; // Se domingo, volta 6 dias; senão, ajusta para segunda
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const monday = getMondayOfWeek(today);
  
  // Gerar array de segunda a sábado (6 dias)
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });

  const checkInsByDate = checkIns.reduce((acc, checkIn) => {
    const date = new Date(checkIn.checked_in_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(checkIn);
    return acc;
  }, {} as Record<string, typeof checkIns>);

  // Contar apenas check-ins da semana atual
  const weekCheckIns = checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.checked_in_at);
    return checkInDate >= monday && checkInDate < new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  });
  
  const totalCheckIns = weekCheckIns.length;
  const progressPercentage = Math.min((totalCheckIns / weeklyGoal) * 100, 100);

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/80 border-border hover-lift animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Progresso Semanal
          </h3>
          <p className="text-xs text-muted-foreground">Acompanhe sua frequência</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground font-medium">Check-ins realizados</span>
            <span className="font-bold text-lg">
              <span className="text-primary">{totalCheckIns}</span>
              <span className="text-muted-foreground">/{weeklyGoal}</span>
            </span>
          </div>
          <Progress value={progressPercentage} className="h-4" />
          {totalCheckIns >= weeklyGoal && (
            <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg animate-bounce-in">
              <p className="text-sm text-primary font-bold flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                Meta da semana alcançada!
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-6 gap-3">
          {weekDays.map((date, index) => {
            const dateStr = date.toDateString();
            const hasCheckIn = checkInsByDate[dateStr];
            const isToday = date.toDateString() === today.toDateString();

            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative",
                    hasCheckIn
                      ? "bg-gradient-to-br from-primary to-primary/80 border-2 border-primary shadow-lg animate-bounce-in"
                      : "bg-muted/50 border-2 border-border/50 hover:border-border",
                    isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  )}
                >
                  {hasCheckIn ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">✓</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {date.getDate()}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  hasCheckIn ? "text-primary" : "text-muted-foreground",
                  isToday && "font-bold"
                )}>
                  {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                </span>
              </div>
            );
          })}
        </div>

        {totalCheckIns > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Últimos check-ins:
            </p>
            <div className="space-y-2">
              {weekCheckIns.slice(0, 3).map((checkIn, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{checkIn.class_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(checkIn.checked_in_at).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
