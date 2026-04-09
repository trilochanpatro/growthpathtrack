import { cn } from "@/lib/utils";
import { Sparkles, RefreshCw, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MotivationQuoteProps {
  quote: string;
  author: string;
  interest: string;
  onRefresh: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  className?: string;
}

export function MotivationQuote({ 
  quote, 
  author, 
  interest, 
  onRefresh, 
  onFavorite,
  isFavorited = false,
  isLoading, 
  isSaving,
  className 
}: MotivationQuoteProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl p-7 md:p-8",
      "btn-gradient",
      "text-primary-foreground",
      className
    )}
    style={{ boxShadow: 'var(--shadow-dream)' }}
    >
      {/* M3 decorative shapes */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-primary-foreground/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-sm" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-sm" />
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary-foreground/4 rounded-full blur-md" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
            {isLoading ? (
              <Skeleton className="h-4 w-32 bg-primary-foreground/20 rounded-full" />
            ) : (
              <span className="text-xs font-semibold opacity-80 tracking-wide uppercase">{interest}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onFavorite && !isLoading && (
              <button
                onClick={onFavorite}
                disabled={isSaving}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50",
                  "hover:scale-105 active:scale-95",
                  isFavorited 
                    ? "bg-red-500/25 hover:bg-red-500/35" 
                    : "bg-primary-foreground/12 hover:bg-primary-foreground/20"
                )}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn("w-4 h-4", isFavorited && "fill-current text-red-300")} />
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="w-9 h-9 rounded-xl bg-primary-foreground/12 hover:bg-primary-foreground/20 flex items-center justify-center transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-3 mb-4">
            <Skeleton className="h-6 w-full bg-primary-foreground/15 rounded-full" />
            <Skeleton className="h-6 w-4/5 bg-primary-foreground/15 rounded-full" />
            <Skeleton className="h-6 w-3/5 bg-primary-foreground/15 rounded-full" />
          </div>
        ) : (
          <blockquote className="text-lg md:text-xl font-semibold leading-relaxed mb-4 tracking-tight">
            "{quote}"
          </blockquote>
        )}
        
        {isLoading ? (
          <Skeleton className="h-4 w-24 bg-primary-foreground/15 rounded-full" />
        ) : (
          <p className="text-sm opacity-70 font-medium">— {author}</p>
        )}
      </div>
    </div>
  );
}
