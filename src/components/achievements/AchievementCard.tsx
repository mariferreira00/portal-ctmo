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
        "p-6 transition-all duration-300",
        completed 
          ? `border-2 ${glowClass} shadow-lg` 
          : "opacity-60 grayscale hover:grayscale-0 hover:opacity-80",
        !completed && "bg-muted/50"
      )}
    >
      <div className="flex items-start gap-4">
        <div 
          className={cn(
            "p-3 rounded-full",
            completed ? rarityColor : "bg-muted"
          )}
        >
          <IconComponent className="w-8 h-8" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg leading-tight">{name}</h3>
            <Badge variant="outline" className={cn("text-xs", rarityColor)}>
              {rarity === "common" && "Comum"}
              {rarity === "rare" && "Raro"}
              {rarity === "epic" && "Épico"}
              {rarity === "legendary" && "Lendário"}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">{description}</p>
          
          {!completed && (
            <div className="space-y-1">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Progresso: {progress}/{requirementValue}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-semibold">{points} pontos</span>
            </div>
            
            {completed && unlockedAt && (
              <span className="text-xs text-muted-foreground">
                Desbloqueado em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
