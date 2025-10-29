import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeeklyProgressProps {
  checkIns: Array<{ checked_in_at: string; class_name: string }>;
}

export function WeeklyProgress({ checkIns }: WeeklyProgressProps) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const checkInsByDate = checkIns.reduce((acc, checkIn) => {
    const date = new Date(checkIn.checked_in_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(checkIn);
    return acc;
  }, {} as Record<string, typeof checkIns>);

  const totalCheckIns = checkIns.length;
  const progressPercentage = Math.min((totalCheckIns / 7) * 100, 100);

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
            <span className="font-semibold text-foreground">{totalCheckIns}/7</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((date, index) => {
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
              {checkIns.slice(0, 3).map((checkIn, index) => (
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
