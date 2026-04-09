import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Sparkles, Bell, Save, X, Plus, Trash2, AlertTriangle, UserX, Download, FileText, FileSpreadsheet, BellRing, Clock, Moon, Sun, Monitor, Palette } from "lucide-react";
import { useThemePreference } from "@/hooks/useThemePreference";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { exportGoalsToCSV, exportHabitsToCSV, exportCompletionsToCSV, exportToPDF } from "@/lib/exportData";
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  sendTestNotification,
  NotificationPreferences as NotifPrefs
} from "@/lib/notifications";
const interestOptions = [
  "Personal Growth",
  "Career",
  "Health",
  "Fitness",
  "Learning",
  "Finance",
  "Relationships",
  "Creativity",
  "Mindfulness",
  "Productivity",
  "Travel",
  "Technology",
];

interface NotificationPrefs {
  dailyReminder: boolean;
  weeklyDigest: boolean;
  goalDeadlines: boolean;
  streakAlerts: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, colorTheme, setThemePreference, setColorTheme } = useThemePreference();
  
  const [displayName, setDisplayName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    dailyReminder: true,
    weeklyDigest: true,
    goalDeadlines: true,
    streakAlerts: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Push notification state
  const [pushNotifEnabled, setPushNotifEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Data for export
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDataForExport();
    }
    
    // Load push notification preferences
    if (isNotificationSupported()) {
      setNotifPermission(getNotificationPermission());
      const prefs = getNotificationPreferences();
      setPushNotifEnabled(prefs.enabled);
      setReminderTime(prefs.reminderTime);
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, interests")
        .eq("user_id", user!.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setDisplayName(data.display_name || "");
        setInterests(data.interests || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataForExport = async () => {
    try {
      const [goalsRes, habitsRes, completionsRes] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user!.id),
        supabase.from("habits").select("*").eq("user_id", user!.id),
        supabase.from("habit_completions").select("*").eq("user_id", user!.id),
      ]);
      
      if (goalsRes.data) setGoals(goalsRes.data);
      if (habitsRes.data) setHabits(habitsRes.data);
      if (completionsRes.data) setCompletions(completionsRes.data);
    } catch (error) {
      console.error("Error fetching data for export:", error);
    }
  };

  const handleExportGoalsCSV = async () => {
    setIsExporting("goals-csv");
    try {
      exportGoalsToCSV(goals);
      toast({ title: "Export complete!", description: "Goals exported to CSV successfully." });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export goals.", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportHabitsCSV = async () => {
    setIsExporting("habits-csv");
    try {
      exportHabitsToCSV(habits, completions);
      toast({ title: "Export complete!", description: "Habits exported to CSV successfully." });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export habits.", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportHistoryCSV = async () => {
    setIsExporting("history-csv");
    try {
      exportCompletionsToCSV(habits, completions);
      toast({ title: "Export complete!", description: "Habit history exported to CSV successfully." });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export history.", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting("pdf");
    try {
      exportToPDF(goals, habits, completions);
      toast({ title: "Export complete!", description: "Data exported to PDF successfully." });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export PDF.", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const handleTogglePushNotifications = async (enabled: boolean) => {
    if (enabled) {
      // Request permission if not granted
      if (notifPermission !== "granted") {
        const granted = await requestNotificationPermission();
        setNotifPermission(getNotificationPermission());
        
        if (!granted) {
          toast({
            title: "Permission denied",
            description: "Please enable notifications in your browser settings.",
            variant: "destructive",
          });
          return;
        }
      }
      
      setPushNotifEnabled(true);
      saveNotificationPreferences({ enabled: true, reminderTime });
      toast({
        title: "Notifications enabled!",
        description: `You'll receive daily reminders at ${reminderTime}.`,
      });
    } else {
      setPushNotifEnabled(false);
      saveNotificationPreferences({ enabled: false });
      toast({
        title: "Notifications disabled",
        description: "You won't receive habit reminders.",
      });
    }
  };

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time);
    saveNotificationPreferences({ reminderTime: time });
    if (pushNotifEnabled) {
      toast({
        title: "Reminder time updated",
        description: `Daily reminders will now arrive at ${time}.`,
      });
    }
  };

  const handleTestNotification = () => {
    if (notifPermission !== "granted") {
      toast({
        title: "Permission required",
        description: "Please enable notifications first.",
        variant: "destructive",
      });
      return;
    }
    sendTestNotification();
    toast({
      title: "Test notification sent!",
      description: "Check your system notifications.",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          interests: interests,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests((prev) => [...prev, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      // Delete all habit completions first (due to foreign key)
      await supabase
        .from("habit_completions")
        .delete()
        .eq("user_id", user!.id);

      // Delete all habits
      await supabase
        .from("habits")
        .delete()
        .eq("user_id", user!.id);

      // Delete all goals
      await supabase
        .from("goals")
        .delete()
        .eq("user_id", user!.id);

      toast({
        title: "Data reset complete",
        description: "All your goals and habits have been deleted.",
      });
    } catch (error) {
      console.error("Error resetting data:", error);
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // First delete all user data
      await supabase.from("habit_completions").delete().eq("user_id", user!.id);
      await supabase.from("habits").delete().eq("user_id", user!.id);
      await supabase.from("goals").delete().eq("user_id", user!.id);
      await supabase.from("profiles").delete().eq("user_id", user!.id);

      // Call edge function to delete the user account
      const { error } = await supabase.functions.invoke("delete-account");

      if (error) throw error;

      // Sign out and redirect
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently removed.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-2xl bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Settings</h1>
              <p className="text-xs text-muted-foreground">Customize your experience</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Profile Section */}
        <Card className="glass-card rounded-2xl border-border/50 mb-6 animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="rounded-xl bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* Interests Section */}
        <Card className="glass-card rounded-2xl border-border/50 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Interests</CardTitle>
                <CardDescription>Choose interests to personalize your motivation quotes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected interests */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {interests.map((interest) => (
                  <div
                    key={interest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Interest options */}
            <div className="flex flex-wrap gap-2">
              {interestOptions
                .filter((i) => !interests.includes(i))
                .map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-colors"
                  >
                    + {interest}
                  </button>
                ))}
            </div>

            {/* Custom interest */}
            <div className="flex gap-2 pt-2">
              <Input
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom interest..."
                className="rounded-xl flex-1"
                onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
              />
              <Button
                onClick={addCustomInterest}
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={!customInterest.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Section */}
        <Card className="glass-card rounded-2xl border-border/50 mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Moon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose your preferred theme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Light/Dark Mode */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Theme Mode</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setThemePreference("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === "light" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Sun className="w-6 h-6" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setThemePreference("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === "dark" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setThemePreference("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === "system" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Monitor className="w-6 h-6" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { id: "teal", name: "Teal", color: "bg-[hsl(160,45%,50%)]" },
                  { id: "orange", name: "Sunset", color: "bg-[hsl(24,85%,58%)]" },
                  { id: "purple", name: "Purple", color: "bg-[hsl(270,70%,60%)]" },
                  { id: "blue", name: "Ocean", color: "bg-[hsl(210,90%,55%)]" },
                  { id: "rose", name: "Rose", color: "bg-[hsl(350,80%,60%)]" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setColorTheme(t.id as "teal" | "orange" | "purple" | "blue" | "rose")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      colorTheme === t.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${t.color}`} />
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications Section */}
        <Card className="glass-card rounded-2xl border-border/50 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Get browser notifications for habit reminders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isNotificationSupported() ? (
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Your browser doesn't support push notifications.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <div>
                    <p className="font-medium text-foreground">Enable Daily Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      {notifPermission === "denied" 
                        ? "Notifications blocked in browser settings" 
                        : "Receive push notifications for your habits"}
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifEnabled}
                    onCheckedChange={handleTogglePushNotifications}
                    disabled={notifPermission === "denied"}
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Reminder Time</p>
                      <p className="text-sm text-muted-foreground">When to send daily reminders</p>
                    </div>
                  </div>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="w-32 rounded-xl"
                    disabled={!pushNotifEnabled}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">Test Notification</p>
                    <p className="text-sm text-muted-foreground">Send a test notification now</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={handleTestNotification}
                    disabled={notifPermission !== "granted"}
                  >
                    <Bell className="w-4 h-4" />
                    Test
                  </Button>
                </div>

                {notifPermission === "denied" && (
                  <p className="text-xs text-destructive pt-2">
                    ⚠️ Notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Email Notifications Section */}
        <Card className="glass-card rounded-2xl border-border/50 mt-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>Configure email notification settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div>
                <p className="font-medium text-foreground">Daily Reminder</p>
                <p className="text-sm text-muted-foreground">Get reminded to check in on your habits</p>
              </div>
              <Switch
                checked={notifications.dailyReminder}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, dailyReminder: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div>
                <p className="font-medium text-foreground">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">Receive a weekly summary of your progress</p>
              </div>
              <Switch
                checked={notifications.weeklyDigest}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, weeklyDigest: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div>
                <p className="font-medium text-foreground">Goal Deadlines</p>
                <p className="text-sm text-muted-foreground">Get notified before goal due dates</p>
              </div>
              <Switch
                checked={notifications.goalDeadlines}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, goalDeadlines: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Streak Alerts</p>
                <p className="text-sm text-muted-foreground">Be warned when you're about to lose a streak</p>
              </div>
              <Switch
                checked={notifications.streakAlerts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, streakAlerts: checked }))
                }
              />
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Note: Email notification preferences are saved locally. Email delivery coming soon!
            </p>
          </CardContent>
        </Card>

        {/* Data Export Section */}
        <Card className="glass-card rounded-2xl border-border/50 mt-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download your goals and habits history</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="rounded-xl justify-start gap-3 h-auto py-4"
                onClick={handleExportGoalsCSV}
                disabled={isExporting !== null}
              >
                <FileSpreadsheet className="w-5 h-5 text-secondary" />
                <div className="text-left">
                  <p className="font-medium">Goals (CSV)</p>
                  <p className="text-xs text-muted-foreground">{goals.length} goals</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="rounded-xl justify-start gap-3 h-auto py-4"
                onClick={handleExportHabitsCSV}
                disabled={isExporting !== null}
              >
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Habits (CSV)</p>
                  <p className="text-xs text-muted-foreground">{habits.length} habits</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="rounded-xl justify-start gap-3 h-auto py-4"
                onClick={handleExportHistoryCSV}
                disabled={isExporting !== null}
              >
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                <div className="text-left">
                  <p className="font-medium">Habit History (CSV)</p>
                  <p className="text-xs text-muted-foreground">{completions.length} check-ins</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="rounded-xl justify-start gap-3 h-auto py-4"
                onClick={handleExportPDF}
                disabled={isExporting !== null}
              >
                <FileText className="w-5 h-5 text-destructive" />
                <div className="text-left">
                  <p className="font-medium">Full Report (PDF)</p>
                  <p className="text-xs text-muted-foreground">Complete summary</p>
                </div>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Your data will be downloaded directly to your device.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone - Reset Data */}
        <Card className="glass-card rounded-2xl border-destructive/30 mt-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div>
                <p className="font-medium text-foreground">Reset All Data</p>
                <p className="text-sm text-muted-foreground">Delete all your goals and habits permanently</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl gap-2">
                    <Trash2 className="w-4 h-4" />
                    Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your goals, habits, and progress data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="rounded-xl bg-destructive hover:bg-destructive/90"
                    >
                      {isResetting ? "Deleting..." : "Yes, delete everything"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl gap-2">
                    <UserX className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-destructive" />
                      Delete your account?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent and cannot be undone. Your account, profile, goals, habits, and all progress will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="rounded-xl bg-destructive hover:bg-destructive/90"
                    >
                      {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
