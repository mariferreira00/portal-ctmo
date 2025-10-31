import React from "react";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { AchievementNotification } from "./achievements/AchievementNotification";

export function GlobalAchievementNotifications() {
  const { newAchievement, clearAchievement } = useAchievementNotifications();

  if (!newAchievement) return null;

  return (
    <AchievementNotification
      achievement={newAchievement}
      onClose={clearAchievement}
    />
  );
}
