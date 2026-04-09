import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, subDays, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, ArrowLeft, Flame, TrendingUp, Calendar, Trophy, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { HabitHeatmap } from "@/components/landing/HabitHeatmap";

interface Goal {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
  created_at: string;
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

export default function Analytics() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [goalsRes, habitsRes, completionsRes] = await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user!.id),
      supabase.from("habits").select("*").eq("user_id", user!.id),
      supabase.from("habit_completions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("completed_date", format(subDays(new Date(), 90), "yyyy-MM-dd")),
    ]);

    if (goalsRes.data) setGoals(goalsRes.data);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) setCompletions(completionsRes.data);
  };

  // Calculate habit completion rate over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const completedCount = completions.filter((c) => c.completed_date === dateStr).length;
    const rate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
    return {
      date: format(date, "EEE"),
      fullDate: dateStr,
      completed: completedCount,
      rate,
    };
  });

  // Calculate weekly data (last 4 weeks)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(new Date(), 3 - i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      let totalPossible = habits.length * 7;
      let totalCompleted = 0;
      
      weekDays.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        totalCompleted += completions.filter((c) => c.completed_date === dateStr).length;
      });
      
      return {
        week: `Week ${4 - i}`,
        label: format(weekStart, "MMM d"),
        completed: totalCompleted,
        rate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
        possible: totalPossible,
      };
    }).reverse();
  }, [completions, habits]);

  // Calculate monthly data (last 3 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const monthDate = subDays(new Date(), i * 30);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd > new Date() ? new Date() : monthEnd });
      
      let totalCompleted = 0;
      monthDays.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        totalCompleted += completions.filter((c) => c.completed_date === dateStr).length;
      });
      
      const totalPossible = habits.length * monthDays.length;
      
      return {
        month: format(monthStart, "MMM"),
        completed: totalCompleted,
        rate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
        days: monthDays.length,
      };
    }).reverse();
  }, [completions, habits]);

  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    completions.forEach((c) => {
      data[c.completed_date] = (data[c.completed_date] || 0) + 1;
    });
    return data;
  }, [completions]);

  // Calculate streak history for each habit
  const habitStreakHistory = useMemo(() => {
    return habits.map((habit) => {
      const habitCompletions = completions
        .filter((c) => c.habit_id === habit.id)
        .map((c) => c.completed_date)
        .sort();
      
      let longestStreak = 0;
      let currentStreak = 0;
      let lastDate: string | null = null;
      
      habitCompletions.forEach((dateStr) => {
        if (lastDate) {
          const diff = differenceInDays(new Date(dateStr), new Date(lastDate));
          if (diff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        lastDate = dateStr;
      });
      
      return {
        name: habit.name.length > 15 ? habit.name.substring(0, 15) + "..." : habit.name,
        fullName: habit.name,
        icon: habit.icon,
        currentStreak: habit.streak,
        longestStreak,
        totalCompletions: habitCompletions.length,
      };
    }).sort((a, b) => b.currentStreak - a.currentStreak);
  }, [habits, completions]);

  // Calculate goal progress distribution
  const goalProgressData = [
    { name: "0-25%", value: goals.filter((g) => g.progress <= 25).length, color: "hsl(var(--destructive))" },
    { name: "26-50%", value: goals.filter((g) => g.progress > 25 && g.progress <= 50).length, color: "hsl(var(--accent))" },
    { name: "51-75%", value: goals.filter((g) => g.progress > 50 && g.progress <= 75).length, color: "hsl(var(--primary))" },
    { name: "76-100%", value: goals.filter((g) => g.progress > 75).length, color: "hsl(var(--secondary))" },
  ].filter((d) => d.value > 0);

  // Streak data per habit
  const streakData = habits.map((h) => ({
    name: h.name.length > 12 ? h.name.substring(0, 12) + "..." : h.name,
    streak: h.streak,
    icon: h.icon,
  }));

  const totalCompletions = completions.length;
  const avgCompletionRate = habits.length > 0 && last7Days.length > 0
    ? Math.round(last7Days.reduce((acc, d) => acc + d.rate, 0) / 7)
    : 0;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;
  const goalsCompleted = goals.filter((g) => g.completed).length;
  const bestDay = last7Days.reduce((best, day) => day.rate > best.rate ? day : best, last7Days[0]);
  const totalActiveHabits = habits.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[30%] w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-[5%] right-[15%] w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-2xl bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Analytics</h1>
              <p className="text-xs text-muted-foreground">Your progress insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card-glow rounded-3xl p-5 group hover:-translate-y-1 transition-all duration-300" style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Avg Completion</h4>
            <p className="text-3xl font-extrabold gradient-text-static">{avgCompletionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </div>
          
          <div className="glass-card-glow rounded-3xl p-5 group hover:-translate-y-1 transition-all duration-300" style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}>
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Longest Streak</h4>
            <p className="text-3xl font-extrabold gradient-text-static">{longestStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">Days</p>
          </div>
          
          <div className="rounded-3xl p-5 btn-gradient text-primary-foreground group hover:-translate-y-1 transition-all duration-300" style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}>
            <div className="w-12 h-12 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-[11px] font-semibold opacity-80 uppercase tracking-widest mb-1">Goals Done</h4>
            <p className="text-3xl font-extrabold">{goalsCompleted}</p>
            <p className="text-xs opacity-70 mt-1">Completed</p>
          </div>
          
          <div className="glass-card-glow rounded-3xl p-5 group hover:-translate-y-1 transition-all duration-300" style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Check-ins</h4>
            <p className="text-3xl font-extrabold gradient-text-static">{totalCompletions}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
        </div>

        {/* Habit Heatmap */}
        <div className="mb-8">
          <HabitHeatmap completions={heatmapData} weeks={12} />
        </div>

        {/* Weekly/Monthly Stats Tabs */}
        <Card className="glass-card rounded-2xl border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Habit Completion Trends</CardTitle>
            <CardDescription>Track your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7Days}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Completion Rate"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="rate"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorRate)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Best Day</p>
                    <p className="font-semibold text-foreground">{bestDay?.date || "-"} ({bestDay?.rate || 0}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Avg Rate</p>
                    <p className="font-semibold text-foreground">{avgCompletionRate}%</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="weekly">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "completed" ? `${value} completions` : `${value}%`,
                          name === "completed" ? "Total" : "Rate"
                        ]}
                      />
                      <Bar dataKey="completed" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  {weeklyData.map((week, i) => (
                    <div key={i} className="text-center">
                      <p className="text-muted-foreground">{week.label}</p>
                      <p className="font-semibold text-foreground">{week.rate}%</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="monthly">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "completed" ? `${value} completions` : `${value}%`,
                          name === "completed" ? "Total" : "Rate"
                        ]}
                      />
                      <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  {monthlyData.map((month, i) => (
                    <div key={i} className="text-center">
                      <p className="text-muted-foreground">{month.month}</p>
                      <p className="font-semibold text-foreground">{month.rate}% ({month.completed})</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Goal Progress Distribution */}
          <Card className="glass-card rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Goal Progress Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {goalProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalProgressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {goalProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No goals to display</p>
                )}
              </div>
              {goalProgressData.length > 0 && (
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {goalProgressData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Habit Streaks Bar Chart */}
          <Card className="glass-card rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Current Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {streakData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={streakData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number) => [`${value} days`, "Streak"]}
                      />
                      <Bar 
                        dataKey="streak" 
                        fill="hsl(var(--secondary))" 
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No habits to display</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Streak History */}
        <Card className="glass-card rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Streak History
            </CardTitle>
            <CardDescription>Track your consistency across all habits</CardDescription>
          </CardHeader>
          <CardContent>
            {habitStreakHistory.length > 0 ? (
              <div className="space-y-4">
                {habitStreakHistory.map((habit, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{habit.fullName}</p>
                      <p className="text-sm text-muted-foreground">{habit.totalCompletions} total completions</p>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <p className="text-2xl font-bold text-secondary">{habit.currentStreak}</p>
                        <p className="text-xs text-muted-foreground">Current</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{habit.longestStreak}</p>
                        <p className="text-xs text-muted-foreground">Best</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-muted-foreground">No habits to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
