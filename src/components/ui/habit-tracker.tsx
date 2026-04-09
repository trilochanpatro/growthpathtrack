import { cn } from "@/lib/utils";
import { Check, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

interface HabitTrackerProps {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  weekProgress: boolean[];
  onToggle: () => void;
  onToggleDay?: (dayIndex: number) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function HabitTracker({ 
  id,
  name, 
  icon, 
  streak, 
  completedToday, 
  weekProgress, 
  onToggle,
  onToggleDay,
  onDelete,
  className 
}: HabitTrackerProps) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const completedDays = weekProgress.filter(Boolean).length;
  
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7;
  
  const getStatus = () => {
    if (completedToday) return "completed" as const;
    if (completedDays > 0) return "in_progress" as const;
    return "not_started" as const;
  };

  const handleDayClick = (index: number) => {
    if (onToggleDay) {
      onToggleDay(index);
    }
  };
  
  return (
    <div className={cn(
      "glass-card rounded-3xl p-5 group",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-105">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground text-[15px]">{name}</h4>
              <StatusBadge status={getStatus()} className="hidden sm:inline-flex" />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Flame className="w-3.5 h-3.5 text-accent" />
              <span className="text-accent font-medium text-xs">{streak} day streak</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <button
            onClick={onToggle}
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200",
              completedToday 
                ? "bg-primary text-primary-foreground shadow-glow scale-100" 
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:scale-105 active:scale-95"
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}
          >
            <Check className={cn("w-5 h-5 transition-transform duration-200", completedToday && "scale-110")} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-1.5">
        {days.map((day, index) => {
          const isToday = index === currentDayIndex;
          const isCompleted = weekProgress[index];
          
          return (
            <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
              <span className={cn(
                "text-[10px] font-semibold tracking-wide",
                isToday ? "text-primary" : "text-muted-foreground/70"
              )}>
                {day}
              </span>
              <button
                onClick={() => handleDayClick(index)}
                className={cn(
                  "w-full aspect-square max-w-[36px] rounded-xl flex items-center justify-center cursor-pointer",
                  "transition-all duration-200 hover:scale-110 active:scale-90",
                  isCompleted 
                    ? "bg-primary/15 text-primary hover:bg-primary/25" 
                    : "bg-muted/60 text-muted-foreground/30 hover:bg-muted",
                  isToday && "ring-2 ring-primary/25 ring-offset-1 ring-offset-background"
                )}
                style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}
              >
                {isCompleted && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
      
      <p className="text-[10px] text-muted-foreground/60 mt-3 text-center font-medium tracking-wide">
        TAP ANY DAY TO TOGGLE
      </p>
    </div>
  );
}
