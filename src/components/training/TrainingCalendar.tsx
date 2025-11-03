import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrainingPost } from "@/hooks/useTrainingPosts";
import { Trophy, TrendingUp } from "lucide-react";
import { toBrasiliaTime, getBrasiliaTime } from "@/lib/timezone";

interface TrainingCalendarProps {
  posts: TrainingPost[];
  currentMonth: Date;
  streak: number;
}

export const TrainingCalendar = ({ posts, currentMonth, streak }: TrainingCalendarProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { locale: ptBR });
  const endDate = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const trainingDates = new Set(
    posts.map((post) => format(toBrasiliaTime(post.training_date), "yyyy-MM-dd"))
  );

  const hasTraining = (date: Date) => {
    return trainingDates.has(format(date, "yyyy-MM-dd"));
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const thisMonth = posts.filter((post) => {
    const postDate = toBrasiliaTime(post.training_date);
    return isSameMonth(postDate, currentMonth);
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sequência</p>
              <p className="text-xl font-bold">{streak} dias</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Este Mês</p>
              <p className="text-xl font-bold">{thisMonth} treinos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasTrained = hasTraining(day);
            const isToday = isSameDay(day, getBrasiliaTime());

            return (
              <div
                key={day.toString()}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg
                  transition-all duration-200
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${hasTrained
                    ? "bg-primary text-primary-foreground font-bold shadow-lg"
                    : "bg-muted hover:bg-muted/80"
                  }
                  ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                `}
              >
                <span className="text-sm">{format(day, "d")}</span>
                {hasTrained && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded" />
            <span>Treinou</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded" />
            <span>Sem treino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded ring-2 ring-primary" />
            <span>Hoje</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
