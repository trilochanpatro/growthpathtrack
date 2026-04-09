import { cn } from "@/lib/utils";
import { Circle, Clock, CheckCircle2 } from "lucide-react";

type Status = "not_started" | "in_progress" | "completed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    icon: Circle,
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "bg-primary/10 text-primary",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-secondary/10 text-secondary",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}

export function getStatusFromProgress(progress: number): Status {
  if (progress === 0) return "not_started";
  if (progress === 100) return "completed";
  return "in_progress";
}
