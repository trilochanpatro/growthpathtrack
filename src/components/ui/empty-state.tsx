import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-10 text-center animate-fade-in",
        className
      )}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-5">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h4 className="text-base font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-[240px] mx-auto mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="rounded-xl interactive-press"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
