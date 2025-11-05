import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Progresso Semanal
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Check-ins realizados</span>
            <span className="font-semibold text-foreground">{totalCheckIns}/{weeklyGoal}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {totalCheckIns >= weeklyGoal && (
            <p className="text-sm text-primary font-semibold mt-2">
              🎉 Meta da semana alcançada!
            </p>
          )}
        </div>

        <div className="grid grid-cols-6 gap-2">
          {weekDays.map((date, index) => {
            const dateStr = date.toDateString();
            const hasCheckIn = checkInsByDate[dateStr];
            const isToday = date.toDateString() === today.toDateString();

            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    hasCheckIn
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted border-2 border-border"
                  } ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  {hasCheckIn ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {date.getDate()}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
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
