import { useState, useEffect, useRef } from "react";
import { Check, Flame, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedSection } from "./AnimatedSection";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";

interface DemoHabit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
}

const initialHabits: DemoHabit[] = [
  { id: "1", name: "Morning Exercise", icon: "🏃", streak: 7, completedToday: false },
  { id: "2", name: "Read 30 minutes", icon: "📚", streak: 12, completedToday: true },
  { id: "3", name: "Drink 8 glasses of water", icon: "💧", streak: 5, completedToday: false },
];

const habitEmojis = ["💪", "🧘", "🎨", "✍️", "🎵", "🌱", "🧠", "❤️"];

export function InteractiveDemo() {
  const [habits, setHabits] = useState<DemoHabit[]>(initialHabits);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💪");
  const hasTriggeredConfetti = useRef(false);

  const totalCompleted = habits.filter((h) => h.completedToday).length;
  const allCompleted = habits.length > 0 && totalCompleted === habits.length;

  useEffect(() => {
    if (allCompleted && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#10b981", "#6366f1", "#f59e0b"],
      });
    } else if (!allCompleted) {
      hasTriggeredConfetti.current = false;
    }
  }, [allCompleted]);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completedToday: !habit.completedToday,
              streak: !habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1),
            }
          : habit
      )
    );
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    setHabits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        icon: selectedEmoji,
        streak: 0,
        completedToday: false,
      },
    ]);
    setNewHabitName("");
    setShowAddForm(false);
  };

  const removeHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Try the <span className="gradient-text">Habit Tracker</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Click checkmarks to complete habits, add your own — no signup needed.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="max-w-lg mx-auto space-y-3">
            {/* Summary bar */}
            <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl px-5 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{totalCompleted}</span> / {habits.length} done today
              </p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">New Habit</p>
                  <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {habitEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                        selectedEmoji === emoji
                          ? "bg-primary/15 ring-2 ring-primary"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Habit name..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHabit()}
                    className="rounded-xl h-9 text-sm"
                  />
                  <Button onClick={addHabit} size="sm" className="rounded-xl h-9">
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Habit list */}
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={cn(
                  "flex items-center gap-3 bg-card border rounded-2xl px-4 py-3 transition-all duration-200",
                  habit.completedToday ? "border-primary/30 bg-primary/5" : "border-border/50"
                )}
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                    habit.completedToday
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Check className="w-4 h-4" />
                </button>

                {/* Info */}
                <span className="text-lg shrink-0">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate transition-all",
                    habit.completedToday ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-accent" />
                    <span>{habit.streak} day streak</span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* All done message */}
            {allCompleted && (
              <p className="text-center text-sm text-primary font-medium py-2 animate-slide-up">
                🎉 All habits completed! Amazing work!
              </p>
            )}

            {/* CTA */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Sign up to save progress and get AI-powered motivation.
              </p>
              <Link to="/auth">
                <Button className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
