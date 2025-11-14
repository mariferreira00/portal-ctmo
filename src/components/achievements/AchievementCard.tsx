import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Crown, Medal, Star, Award, Target, Sword, 
  Flame, Calendar, CalendarCheck, Footprints
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  progress?: number;
  requirementValue: number;
  completed: boolean;
  unlockedAt?: string;
}

const iconMap: Record<string, any> = {
  Trophy,
  Crown,
  Medal,
  Star,
  Award,
  Target,
  Sword,
  Flame,
  Calendar,
  CalendarCheck,
  Footprints,
};

const rarityColors = {
  common: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
  rare: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  legendary: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

const rarityGlow = {
  common: "shadow-slate-500/20",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-amber-500/50",
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  name,
  description,
  icon,
  category,
  points,
  rarity,
  progress = 0,
  requirementValue,
  completed,
  unlockedAt,
}) => {
  const IconComponent = iconMap[icon] || Trophy;
  const progressPercentage = (progress / requirementValue) * 100;
  const rarityColor = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  const glowClass = completed ? rarityGlow[rarity as keyof typeof rarityGlow] : "";

  return (
    <Card 
      className={cn(
        "p-6 transition-all duration-500 hover-lift overflow-hidden relative group",
        completed 
          ? `border-2 ${glowClass} shadow-2xl animate-scale-in` 
          : "opacity-60 grayscale hover:grayscale-0 hover:opacity-90 hover:border-primary/30",
        !completed && "bg-gradient-to-br from-muted/50 to-muted/20"
      )}
    >
      {/* Shimmer effect for unlocked achievements */}
      {completed && (
        <div className="absolute inset-0 animate-shimmer opacity-50 pointer-events-none" />
      )}

      <div className="flex items-start gap-4 relative z-10">
        <div 
          className={cn(
            "p-4 rounded-2xl transition-all duration-300 relative",
            completed 
              ? `${rarityColor} shadow-lg animate-bounce-in` 
              : "bg-muted/80 group-hover:bg-muted"
          )}
        >
          <IconComponent className={cn(
            "w-10 h-10 transition-transform duration-300",
            completed && "group-hover:scale-110 group-hover:rotate-12"
          )} />
          {completed && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce-in">
              <Trophy className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-xl leading-tight animate-slide-up">{name}</h3>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-bold px-3 py-1 animate-slide-down",
                rarityColor,
                completed && "shadow-md"
              )}
            >
              {rarity === "common" && "⭐ Comum"}
              {rarity === "rare" && "💎 Raro"}
              {rarity === "epic" && "🔥 Épico"}
              {rarity === "legendary" && "👑 Lendário"}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          
          {!completed && (
            <div className="space-y-2 animate-slide-up">
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground font-medium">
                Progresso: <span className="text-primary">{progress}/{requirementValue}</span>
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                completed ? "bg-primary/20" : "bg-muted"
              )}>
                <Trophy className={cn(
                  "w-5 h-5",
                  completed ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className="font-bold text-base">
                <span className={completed ? "text-primary" : "text-foreground"}>
                  {points}
                </span>
                <span className="text-muted-foreground text-sm ml-1">pontos</span>
              </span>
            </div>
            
            {completed && unlockedAt && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                🎉 {new Date(unlockedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
