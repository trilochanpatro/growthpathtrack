import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Target, Calendar, Edit2, CheckCircle2, PartyPopper, Trash2, Award, Star, Zap, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

export interface MilestoneInfo {
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  message: string;
}

export const MILESTONES: MilestoneInfo[] = [
  { value: 25, label: "25%", icon: Star, color: "text-amber-500", message: "Great start! You're making progress!" },
  { value: 50, label: "50%", icon: Zap, color: "text-blue-500", message: "Halfway there! Keep pushing!" },
  { value: 75, label: "75%", icon: Award, color: "text-purple-500", message: "Almost there! The finish line is in sight!" },
  { value: 100, label: "100%", icon: Trophy, color: "text-secondary", message: "Goal achieved! Congratulations!" },
];

interface GoalCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: string;
  category: string;
  className?: string;
  onProgressChange?: (id: string, progress: number, reachedMilestone?: MilestoneInfo) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const fireCelebration = (element: HTMLElement, intensity: "small" | "medium" | "large" = "medium") => {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  const particleCounts = { small: 30, medium: 60, large: 100 };
  const spreads = { small: 40, medium: 55, large: 70 };

  confetti({
    particleCount: particleCounts[intensity],
    spread: spreads[intensity],
    origin: { x, y },
    colors: ['#22c55e', '#10b981', '#6366f1', '#f59e0b', '#ec4899'],
    zIndex: 9999,
  });

  if (intensity === "large") {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: x - 0.1, y },
        colors: ['#22c55e', '#10b981', '#6366f1'],
        zIndex: 9999,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: x + 0.1, y },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6'],
        zIndex: 9999,
      });
    }, 150);
  }
};

const getReachedMilestones = (progress: number): MilestoneInfo[] => {
  return MILESTONES.filter(m => progress >= m.value);
};

const getNewlyReachedMilestone = (oldProgress: number, newProgress: number): MilestoneInfo | undefined => {
  for (const milestone of MILESTONES) {
    if (oldProgress < milestone.value && newProgress >= milestone.value) {
      return milestone;
    }
  }
  return undefined;
};

export function GoalCard({ 
  id,
  title, 
  description, 
  progress,
  dueDate, 
  category, 
  className,
  onProgressChange,
  onEdit,
  onDelete
}: GoalCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<MilestoneInfo | null>(null);
  const [localProgress, setLocalProgress] = useState(progress);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
  };

  const handleProgressCommit = (value: number[]) => {
    const newProgress = value[0];
    const milestone = getNewlyReachedMilestone(progress, newProgress);
    
    if (milestone) {
      setCelebrationMilestone(milestone);
      setShowCelebration(true);
      
      if (cardRef.current) {
        const intensity = milestone.value === 100 ? "large" : milestone.value >= 50 ? "medium" : "small";
        fireCelebration(cardRef.current, intensity);
      }
      
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationMilestone(null);
      }, 2000);
    }
    
    onProgressChange?.(id, newProgress, milestone);
  };

  const reachedMilestones = getReachedMilestones(localProgress);
  const isCompleted = localProgress === 100;

  return (
    <div 
      ref={cardRef}
      className={cn(
        "glass-card-glow rounded-3xl p-6 group relative overflow-hidden transition-all duration-300 hover:-translate-y-1",
        showCelebration && "ring-2 ring-secondary animate-pulse-glow",
        className
      )}
    >
      {/* Background gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
      
      {/* Celebration overlay */}
      {showCelebration && celebrationMilestone && (
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/25 to-primary/25 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in rounded-3xl">
          <div className="text-center">
            <celebrationMilestone.icon className={cn("w-14 h-14 mx-auto mb-3 animate-bounce", celebrationMilestone.color)} />
            <p className="font-extrabold text-xl text-foreground">
              {celebrationMilestone.value === 100 ? "🎉 Goal Achieved!" : `${celebrationMilestone.label} Milestone!`}
            </p>
            <p className="text-sm text-muted-foreground font-medium">{celebrationMilestone.message}</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4 relative z-[1]">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            isCompleted ? "bg-secondary/20 shadow-lg" : "bg-primary/15 shadow-md"
          )}>
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-secondary" />
            ) : (
              <Target className="w-6 h-6 text-primary" />
            )}
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{category}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mr-1">
            <Calendar className="w-4 h-4" />
            <span>{dueDate}</span>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={() => onEdit(id)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      <h3 className={cn(
        "text-lg font-semibold mb-2 group-hover:text-primary transition-colors",
        isCompleted ? "text-secondary line-through opacity-70" : "text-foreground"
      )}>
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
      
      {/* Milestone badges */}
      <div className="flex gap-2 mb-4">
        {MILESTONES.map((milestone) => {
          const MilestoneIcon = milestone.icon;
          const isReached = localProgress >= milestone.value;
          return (
            <div 
              key={milestone.value}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                isReached 
                  ? `bg-background/80 ${milestone.color} scale-100` 
                  : "bg-muted/50 text-muted-foreground opacity-50 scale-95"
              )}
              title={isReached ? `${milestone.label} reached!` : `Reach ${milestone.label}`}
            >
              <MilestoneIcon className="w-3 h-3" />
              <span>{milestone.label}</span>
            </div>
          );
        })}
      </div>
      
      {/* Progress Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">Progress</label>
          <span className={cn(
            "text-sm font-bold",
            isCompleted ? "text-secondary" : "text-primary"
          )}>
            {localProgress}%
          </span>
        </div>
        <Slider
          value={[localProgress]}
          onValueChange={handleProgressChange}
          onValueCommit={handleProgressCommit}
          max={100}
          step={5}
          className={cn(
            "cursor-pointer",
            isCompleted && "[&_[role=slider]]:bg-secondary [&_.bg-primary]:bg-secondary"
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}

// Helper to convert progress to status
export type GoalStatus = "not_started" | "in_progress" | "completed";

export function progressToStatus(progress: number): GoalStatus {
  if (progress === 0) return "not_started";
  if (progress === 100) return "completed";
  return "in_progress";
}

// Helper to convert status to progress
export function statusToProgress(status: GoalStatus): number {
  if (status === "not_started") return 0;
  if (status === "completed") return 100;
  return 50;
}
