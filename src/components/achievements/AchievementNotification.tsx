import React, { useEffect, useState } from "react";
import { Trophy, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Achievement {
  name: string;
  description: string;
  points: number;
  rarity: string;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

const rarityColors = {
  common: "from-slate-500 to-slate-600",
  rare: "from-blue-500 to-blue-600",
  epic: "from-purple-500 to-purple-600",
  legendary: "from-amber-500 to-amber-600",
};

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const gradient = rarityColors[achievement.rarity as keyof typeof rarityColors] || rarityColors.common;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 transition-all duration-300 transform",
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
      style={{ maxWidth: "400px" }}
    >
      <Card className={cn(
        "p-6 bg-gradient-to-r shadow-2xl border-2",
        gradient,
        "text-white"
      )}>
        <div className="flex items-start gap-4">
          <div className="relative">
            <Trophy className="w-12 h-12 animate-bounce" />
            <Sparkles className="w-4 h-4 absolute -top-1 -right-1 animate-pulse" />
          </div>
          
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">
              Conquista Desbloqueada!
            </p>
            <h3 className="font-bold text-xl mb-1">{achievement.name}</h3>
            <p className="text-sm opacity-90 mb-2">{achievement.description}</p>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold">+{achievement.points} pontos</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
