import { useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onDelete?: () => void;
  className?: string;
}

export function SwipeableCard({ children, onDelete, className }: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow swiping left (negative values)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If swiped more than 60px, trigger delete action
    if (translateX < -60) {
      setTranslateX(-100);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = () => {
    setTranslateX(0);
    onDelete?.();
  };

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center rounded-r-2xl">
        <button
          onClick={handleDelete}
          className="w-full h-full flex items-center justify-center"
          aria-label="Delete"
        >
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </button>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "relative bg-background transition-transform",
          !isDragging && "duration-300"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
