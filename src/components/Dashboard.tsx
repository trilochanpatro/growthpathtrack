import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoalCard, progressToStatus, MilestoneInfo } from "@/components/ui/goal-card";
import { HabitTracker } from "@/components/ui/habit-tracker";
import { EmptyState } from "@/components/ui/empty-state";
import { MotivationQuote } from "@/components/ui/motivation-quote";
import { StatsCard } from "@/components/ui/stats-card";
import { GoalFormDialog } from "@/components/GoalFormDialog";
import { GoalEditDialog } from "@/components/GoalEditDialog";
import { HabitFormDialog } from "@/components/HabitFormDialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { FavoriteQuotesDialog } from "@/components/FavoriteQuotesDialog";
import { Target, Flame, Trophy, TrendingUp, Plus, Settings, LogOut, BarChart3, Heart, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { startReminderScheduler, stopReminderScheduler } from "@/lib/notifications";
import { ColorThemeToggle } from "@/components/ColorThemeToggle";
import { GoalCoachChat } from "@/components/GoalCoachChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  progress: number;
  due_date: string | null;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
}

interface HabitCompletion {
  habit_id: string;
  completed_date: string;
}

interface Profile {
  display_name: string | null;
  interests: string[];
}

interface QuoteData {
  quote: string;
  author: string;
  interest: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quote, setQuote] = useState<QuoteData>({
    quote: "Every day is a new opportunity to become a better version of yourself.",
    author: "Anonymous",
    interest: "Personal Growth"
  });
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isGoalEditDialogOpen, setIsGoalEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isCreatingHabit, setIsCreatingHabit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'goal' | 'habit'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQuoteFavorited, setIsQuoteFavorited] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGoals();
      fetchHabits();
      fetchHabitCompletions();
    }
  }, [user]);

  // Generate quote on mount
  useEffect(() => {
    if (user && profile) {
      generateQuote();
    }
  }, [profile]);

  // Calculate incomplete habits for notification
  const getIncompleteHabitsCount = useCallback(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const completedToday = habitCompletions.filter(c => c.completed_date === today).length;
    return habits.length - completedToday;
  }, [habits, habitCompletions]);

  // Start notification scheduler
  useEffect(() => {
    if (user && habits.length > 0) {
      startReminderScheduler(getIncompleteHabitsCount);
    }
    
    return () => {
      stopReminderScheduler();
    };
  }, [user, habits.length, getIncompleteHabitsCount]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, interests")
      .eq("user_id", user!.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchGoals = async () => {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setGoals(data);
  };

  const fetchHabits = async () => {
    const { data } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setHabits(data);
  };

  const fetchHabitCompletions = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const { data } = await supabase
      .from("habit_completions")
      .select("habit_id, completed_date")
      .eq("user_id", user!.id)
      .gte("completed_date", format(weekStart, "yyyy-MM-dd"));
    if (data) setHabitCompletions(data);
  };

  const generateQuote = async () => {
    setIsQuoteLoading(true);
    setIsQuoteFavorited(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quote", {
        body: { interests: profile?.interests || [], goals: goals.slice(0, 3) },
      });
      if (error) throw error;
      if (data) setQuote(data);
    } catch (error) {
      console.error("Failed to generate quote:", error);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  const toggleFavoriteQuote = async () => {
    if (!user) return;
    
    setIsSavingFavorite(true);
    try {
      if (isQuoteFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_quotes")
          .delete()
          .eq("user_id", user.id)
          .eq("quote", quote.quote);
        
        if (error) throw error;
        
        setIsQuoteFavorited(false);
        toast({ title: "Quote removed", description: "Removed from favorites" });
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorite_quotes").insert({
          user_id: user.id,
          quote: quote.quote,
          author: quote.author,
          interest: quote.interest,
        });
        
        if (error) throw error;
        
        setIsQuoteFavorited(true);
        toast({ title: "Quote saved!", description: "Added to your favorites" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update favorites", variant: "destructive" });
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const createGoal = async (data: { title: string; description?: string; category: string; dueDate?: Date }) => {
    setIsCreatingGoal(true);
    try {
      const { error } = await supabase.from("goals").insert({
        user_id: user!.id,
        title: data.title,
        description: data.description || null,
        category: data.category,
        due_date: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
      });
      if (error) throw error;
      toast({ title: "Goal created!", description: "Your new goal has been added." });
      fetchGoals();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const updateGoal = async (goalId: string, data: { title: string; description?: string; category: string; dueDate?: Date | null }) => {
    setIsEditingGoal(true);
    try {
      const { error } = await supabase.from("goals").update({
        title: data.title,
        description: data.description || null,
        category: data.category,
        due_date: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
      }).eq("id", goalId);
      if (error) throw error;
      toast({ title: "Goal updated!", description: "Your goal has been updated." });
      fetchGoals();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update goal", variant: "destructive" });
    } finally {
      setIsEditingGoal(false);
    }
  };

  const updateGoalProgress = async (goalId: string, newProgress: number, milestone?: MilestoneInfo) => {
    try {
      const completed = newProgress === 100;
      const { error } = await supabase.from("goals").update({ 
        progress: newProgress,
        completed
      }).eq("id", goalId);
      if (error) throw error;
      setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, progress: newProgress, completed } : g));
      
      // Show milestone notification
      if (milestone) {
        const MilestoneIcon = milestone.icon;
        if (milestone.value === 100) {
          toast({ 
            title: "🎉 Goal Achieved!", 
            description: milestone.message
          });
        } else {
          toast({ 
            title: `🏆 ${milestone.label} Milestone Reached!`, 
            description: milestone.message
          });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
    }
  };

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setEditingGoal(goal);
      setIsGoalEditDialogOpen(true);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setDeleteTarget({ type: 'goal', id: goalId, name: goal.title });
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      setDeleteTarget({ type: 'habit', id: habitId, name: habit.name });
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'goal') {
        const { error } = await supabase.from("goals").delete().eq("id", deleteTarget.id);
        if (error) throw error;
        toast({ title: "Goal deleted", description: "Your goal has been removed." });
        fetchGoals();
      } else {
        // Delete habit completions first, then the habit
        await supabase.from("habit_completions").delete().eq("habit_id", deleteTarget.id);
        const { error } = await supabase.from("habits").delete().eq("id", deleteTarget.id);
        if (error) throw error;
        toast({ title: "Habit deleted", description: "Your habit has been removed." });
        fetchHabits();
        fetchHabitCompletions();
      }
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Error", description: `Failed to delete ${deleteTarget.type}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const createHabit = async (data: { name: string; icon: string }) => {
    setIsCreatingHabit(true);
    try {
      const { error } = await supabase.from("habits").insert({
        user_id: user!.id,
        name: data.name,
        icon: data.icon,
      });
      if (error) throw error;
      toast({ title: "Habit created!", description: "Your new habit has been added." });
      fetchHabits();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create habit", variant: "destructive" });
    } finally {
      setIsCreatingHabit(false);
    }
  };

  const toggleHabitCompletion = async (habitId: string, date?: string) => {
    const targetDate = date || format(new Date(), "yyyy-MM-dd");
    const isCompleted = habitCompletions.some(
      (c) => c.habit_id === habitId && c.completed_date === targetDate
    );

    try {
      if (isCompleted) {
        await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .eq("completed_date", targetDate);
      } else {
        await supabase.from("habit_completions").insert({
          habit_id: habitId,
          user_id: user!.id,
          completed_date: targetDate,
        });
      }
      fetchHabitCompletions();
      
      // Only update streak if toggling today
      const today = format(new Date(), "yyyy-MM-dd");
      if (targetDate === today) {
        const habit = habits.find((h) => h.id === habitId);
        if (habit) {
          const newStreak = isCompleted ? Math.max(0, habit.streak - 1) : habit.streak + 1;
          await supabase.from("habits").update({ streak: newStreak }).eq("id", habitId);
          fetchHabits();
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update habit", variant: "destructive" });
    }
  };

  const getWeekProgress = (habitId: string): boolean[] => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(addDays(weekStart, i), "yyyy-MM-dd");
      return habitCompletions.some((c) => c.habit_id === habitId && c.completed_date === date);
    });
  };

  const getDateForDayIndex = (dayIndex: number): string => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(addDays(weekStart, dayIndex), "yyyy-MM-dd");
  };

  const toggleHabitDay = (habitId: string, dayIndex: number) => {
    const date = getDateForDayIndex(dayIndex);
    toggleHabitCompletion(habitId, date);
  };

  const isHabitCompletedToday = (habitId: string): boolean => {
    const today = format(new Date(), "yyyy-MM-dd");
    return habitCompletions.some((c) => c.habit_id === habitId && c.completed_date === today);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const completedHabitsToday = habits.filter((h) => isHabitCompletedToday(h.id)).length;
  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-2xl bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl btn-gradient flex items-center justify-center shadow-glow">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text-static tracking-tight">GrowthPath</h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Track • Grow • Achieve</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ColorThemeToggle />
            <Link to="/analytics">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/8 transition-all duration-200">
                <BarChart3 className="w-5 h-5" />
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-2xl btn-gradient flex items-center justify-center text-primary-foreground font-bold text-base hover:scale-105 active:scale-95 transition-transform duration-200">
                  {displayName.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover/95 backdrop-blur-xl border-border/40 shadow-elevated rounded-2xl">
                <div className="px-3 py-3 border-b border-border/40">
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer py-2.5">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer py-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
            {getGreeting()}, <span className="gradient-text">{displayName}</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {totalStreak > 0 
              ? `You're on a ${totalStreak}-day streak! Keep pushing towards your goals.`
              : "Start building your streak today. Every journey begins with a single step!"
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Active Goals"
            value={goals.filter((g) => !g.completed).length}
            subtitle={`${goals.length} total`}
            icon={Target}
            trend="up"
            trendValue="Keep going"
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          />
          <StatsCard
            title="Today's Habits"
            value={`${completedHabitsToday}/${habits.length}`}
            subtitle="Complete them all!"
            icon={Flame}
            variant="primary"
            className="animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          />
          <StatsCard
            title="Total Streak"
            value={totalStreak}
            subtitle="Days combined"
            icon={TrendingUp}
            trend="up"
            trendValue="Growing"
            className="animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          />
          <StatsCard
            title="Completed"
            value={goals.filter((g) => g.completed).length}
            subtitle="Goals achieved"
            icon={Trophy}
            variant="secondary"
            className="animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        {/* Motivation Quote */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">Daily Inspiration</h3>
            <FavoriteQuotesDialog
              trigger={
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                  <Heart className="w-4 h-4" />
                  Favorites
                </Button>
              }
            />
          </div>
          <MotivationQuote
            quote={quote.quote}
            author={quote.author}
            interest={quote.interest}
            onRefresh={generateQuote}
            onFavorite={toggleFavoriteQuote}
            isFavorited={isQuoteFavorited}
            isLoading={isQuoteLoading}
            isSaving={isSavingFavorite}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Goals Section */}
          <section className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Your Goals</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-2"
                onClick={() => setIsGoalDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </div>
            <div className="space-y-4">
              {goals.filter((g) => !g.completed).length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No active goals"
                  description="Set your first goal and start tracking your progress toward what matters most."
                  actionLabel="Create Goal"
                  onAction={() => setIsGoalDialogOpen(true)}
                />
              ) : (
                goals.filter((g) => !g.completed).map((goal) => (
                  <SwipeableCard key={goal.id} onDelete={() => handleDeleteGoal(goal.id)}>
                    <GoalCard
                      id={goal.id}
                      title={goal.title}
                      description={goal.description || ""}
                      progress={goal.progress}
                      dueDate={goal.due_date ? format(new Date(goal.due_date), "MMM d") : "No deadline"}
                      category={goal.category}
                      onProgressChange={updateGoalProgress}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                    />
                  </SwipeableCard>
                ))
              )}
            </div>
          </section>

          {/* Habits Section */}
          <section className="animate-slide-up" style={{ animationDelay: "0.7s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Daily Habits</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-2"
                onClick={() => setIsHabitDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add Habit
              </Button>
            </div>
            <div className="space-y-4">
              {habits.length === 0 ? (
                <EmptyState
                  icon={Flame}
                  title="No habits yet"
                  description="Build consistency by tracking daily habits. Small actions lead to big changes."
                  actionLabel="Add Habit"
                  onAction={() => setIsHabitDialogOpen(true)}
                />
              ) : (
                habits.map((habit) => (
                  <SwipeableCard key={habit.id} onDelete={() => handleDeleteHabit(habit.id)}>
                    <HabitTracker
                      id={habit.id}
                      name={habit.name}
                      icon={habit.icon}
                      streak={habit.streak}
                      completedToday={isHabitCompletedToday(habit.id)}
                      weekProgress={getWeekProgress(habit.id)}
                      onToggle={() => toggleHabitCompletion(habit.id)}
                      onToggleDay={(dayIndex) => toggleHabitDay(habit.id, dayIndex)}
                      onDelete={handleDeleteHabit}
                    />
                  </SwipeableCard>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Dialogs */}
      <GoalFormDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        onSubmit={createGoal}
        isLoading={isCreatingGoal}
      />
      <GoalEditDialog
        open={isGoalEditDialogOpen}
        onOpenChange={setIsGoalEditDialogOpen}
        goal={editingGoal}
        onSubmit={updateGoal}
        isLoading={isEditingGoal}
      />
      <HabitFormDialog
        open={isHabitDialogOpen}
        onOpenChange={setIsHabitDialogOpen}
        onSubmit={createHabit}
        isLoading={isCreatingHabit}
      />
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === 'goal' ? 'Goal' : 'Habit'}?`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      {/* AI Goal Coach Chat */}
      <GoalCoachChat onAddGoal={async (data) => {
        await createGoal({ title: data.title, description: data.description, category: data.category });
      }} />
    </div>
  );
}
