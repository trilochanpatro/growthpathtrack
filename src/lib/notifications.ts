// Browser Notification Service for Daily Habit Reminders

const NOTIFICATION_STORAGE_KEY = "growthpath_notification_prefs";

export interface NotificationPreferences {
  enabled: boolean;
  reminderTime: string; // HH:mm format
  lastNotificationDate: string | null;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: false,
  reminderTime: "09:00",
  lastNotificationDate: null,
};

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn("Notifications not supported");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

// Get stored preferences
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error reading notification preferences:", error);
  }
  return DEFAULT_PREFS;
}

// Save preferences
export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): void {
  try {
    const current = getNotificationPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving notification preferences:", error);
  }
}

// Show a notification
export function showNotification(title: string, options?: NotificationOptions): void {
  if (getNotificationPermission() !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "growthpath-reminder",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

// Check if we should show a reminder now
export function shouldShowReminder(prefs: NotificationPreferences): boolean {
  if (!prefs.enabled) return false;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Already showed reminder today
  if (prefs.lastNotificationDate === today) return false;

  const [hours, minutes] = prefs.reminderTime.split(":").map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  // It's past the reminder time
  return now >= reminderTime;
}

// Show habit reminder notification
export function showHabitReminder(incompleteCount: number): void {
  const prefs = getNotificationPreferences();
  
  if (!shouldShowReminder(prefs)) return;

  const title = incompleteCount > 0 
    ? `🎯 ${incompleteCount} habit${incompleteCount > 1 ? "s" : ""} waiting for you!`
    : "✨ Check in on your habits today!";
    
  const body = incompleteCount > 0
    ? "Don't break your streak! Complete your daily habits now."
    : "Great progress! Keep building those positive habits.";

  showNotification(title, { body });

  // Mark as shown today
  saveNotificationPreferences({
    lastNotificationDate: new Date().toISOString().split("T")[0],
  });
}

// Schedule next check (runs every minute when page is active)
let reminderInterval: ReturnType<typeof setInterval> | null = null;

export function startReminderScheduler(getIncompleteCount: () => number): void {
  stopReminderScheduler();

  // Check immediately
  const prefs = getNotificationPreferences();
  if (prefs.enabled && shouldShowReminder(prefs)) {
    showHabitReminder(getIncompleteCount());
  }

  // Check every minute
  reminderInterval = setInterval(() => {
    const currentPrefs = getNotificationPreferences();
    if (currentPrefs.enabled && shouldShowReminder(currentPrefs)) {
      showHabitReminder(getIncompleteCount());
    }
  }, 60000); // Check every minute
}

export function stopReminderScheduler(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

// Test notification
export function sendTestNotification(): void {
  showNotification("🔔 GrowthPath Reminder", {
    body: "Notifications are working! You'll receive daily habit reminders.",
  });
}
