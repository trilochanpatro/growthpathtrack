import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "primary" | "secondary";
  className?: string;
  style?: React.CSSProperties;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  variant = "default",
  className,
  style
}: StatsCardProps) {
  return (
    <div 
      className={cn(
        "rounded-3xl p-5 md:p-6 transition-all duration-300 group cursor-default",
        "hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]",
        variant === "default" && "bg-card border border-border/50 shadow-soft",
        variant === "primary" && "btn-gradient text-primary-foreground",
        variant === "secondary" && "bg-primary/8 border border-primary/15 shadow-soft dark:bg-primary/10",
        className
      )}
      style={{
        ...style,
        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
          "group-hover:scale-105 group-hover:rotate-1",
          variant === "default" && "bg-primary/10 text-primary",
          variant === "primary" && "bg-primary-foreground/20 text-primary-foreground",
          variant === "secondary" && "bg-primary/15 text-primary",
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
            trend === "up" && "bg-primary/12 text-primary dark:bg-primary/20",
            trend === "down" && "bg-destructive/12 text-destructive dark:bg-destructive/20",
            trend === "neutral" && "bg-muted text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </div>
        )}
      </div>
      
      <h4 className={cn(
        "text-[11px] font-semibold mb-1.5 uppercase tracking-widest",
        variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
      )}>
        {title}
      </h4>
      <p className={cn(
        "text-3xl md:text-4xl font-extrabold mb-1 tracking-tight",
        variant === "primary" ? "text-primary-foreground" : "text-foreground"
      )}>{value}</p>
      <p className={cn(
        "text-xs font-medium",
        variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
      )}>
        {subtitle}
      </p>
    </div>
  );
}
