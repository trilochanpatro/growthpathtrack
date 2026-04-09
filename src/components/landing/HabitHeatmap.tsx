import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfWeek, addDays } from "date-fns";

interface HabitHeatmapProps {
  completions?: Record<string, number>; // date string -> completion count
  weeks?: number;
}

const generateMockData = (weeks: number): Record<string, number> => {
  const data: Record<string, number> = {};
  const today = new Date();
  const totalDays = weeks * 7;

  for (let i = 0; i < totalDays; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");
    // Generate weighted random completions (more likely to have some activity)
    const rand = Math.random();
    if (rand > 0.3) {
      data[dateStr] = rand > 0.9 ? 4 : rand > 0.7 ? 3 : rand > 0.5 ? 2 : 1;
    }
  }
  return data;
};

const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-secondary/30";
  if (count === 2) return "bg-secondary/50";
  if (count === 3) return "bg-secondary/70";
  return "bg-secondary";
};

export function HabitHeatmap({ completions, weeks = 12 }: HabitHeatmapProps) {
  const data = useMemo(() => completions || generateMockData(weeks), [completions, weeks]);

  const calendar = useMemo(() => {
    const today = new Date();
    const endDate = today;
    const startDate = startOfWeek(subDays(today, (weeks - 1) * 7));
    
    const weeksArray: { date: Date; count: number }[][] = [];
    let currentDate = startDate;
    let currentWeek: { date: Date; count: number }[] = [];

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      currentWeek.push({
        date: currentDate,
        count: data[dateStr] || 0,
      });

      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }

      currentDate = addDays(currentDate, 1);
    }

    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [data, weeks]);

  const months = useMemo(() => {
    const monthLabels: { name: string; index: number }[] = [];
    let lastMonth = -1;

    calendar.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]?.date;
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            name: format(firstDayOfWeek, "MMM"),
            index: weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return monthLabels;
  }, [calendar]);

  const totalCompletions = Object.values(data).reduce((sum, count) => sum + count, 0);
  const activeDays = Object.values(data).filter((count) => count > 0).length;
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(today, i), "yyyy-MM-dd");
      if (data[dateStr] && data[dateStr] > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [data]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Activity Overview</h3>
          <p className="text-sm text-muted-foreground">Your habit completion history</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-foreground">{totalCompletions}</p>
            <p className="text-xs text-muted-foreground">Completions</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-secondary">{activeDays}</p>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-primary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-2 text-xs text-muted-foreground pl-8">
        {months.map((month, i) => (
          <span
            key={i}
            className="absolute"
            style={{ marginLeft: `${month.index * 14 + 32}px` }}
          >
            {month.name}
          </span>
        ))}
      </div>

      <div className="flex gap-1 mt-6">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
          <span className="h-3"></span>
          <span className="h-3 flex items-center">Mon</span>
          <span className="h-3"></span>
          <span className="h-3 flex items-center">Wed</span>
          <span className="h-3"></span>
          <span className="h-3 flex items-center">Fri</span>
          <span className="h-3"></span>
        </div>

        {/* Heatmap grid */}
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {calendar.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-foreground/20 cursor-pointer",
                          getIntensityClass(day.count)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{format(day.date, "MMM d, yyyy")}</p>
                      <p className="text-muted-foreground">
                        {day.count === 0
                          ? "No habits completed"
                          : `${day.count} habit${day.count > 1 ? "s" : ""} completed`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-secondary/30" />
          <div className="w-3 h-3 rounded-sm bg-secondary/50" />
          <div className="w-3 h-3 rounded-sm bg-secondary/70" />
          <div className="w-3 h-3 rounded-sm bg-secondary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
