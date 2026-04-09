import { jsPDF } from "jspdf";
import { format } from "date-fns";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  progress: number;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  created_at: string;
}

interface HabitCompletion {
  habit_id: string;
  completed_date: string;
}

// Export goals to CSV
export function exportGoalsToCSV(goals: Goal[]): void {
  const headers = ["Title", "Description", "Category", "Progress", "Due Date", "Completed", "Created"];
  
  const rows = goals.map((goal) => [
    `"${goal.title.replace(/"/g, '""')}"`,
    `"${(goal.description || "").replace(/"/g, '""')}"`,
    goal.category,
    `${goal.progress}%`,
    goal.due_date ? format(new Date(goal.due_date), "MMM d, yyyy") : "No deadline",
    goal.completed ? "Yes" : "No",
    format(new Date(goal.created_at), "MMM d, yyyy"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadFile(csvContent, `goals-export-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
}

// Export habits to CSV
export function exportHabitsToCSV(habits: Habit[], completions: HabitCompletion[]): void {
  const headers = ["Name", "Icon", "Current Streak", "Total Completions", "Created"];
  
  const rows = habits.map((habit) => {
    const habitCompletions = completions.filter((c) => c.habit_id === habit.id).length;
    return [
      `"${habit.name.replace(/"/g, '""')}"`,
      habit.icon,
      `${habit.streak} days`,
      habitCompletions.toString(),
      format(new Date(habit.created_at), "MMM d, yyyy"),
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadFile(csvContent, `habits-export-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
}

// Export habit completions to CSV
export function exportCompletionsToCSV(habits: Habit[], completions: HabitCompletion[]): void {
  const headers = ["Habit Name", "Completed Date"];
  
  const rows = completions.map((completion) => {
    const habit = habits.find((h) => h.id === completion.habit_id);
    return [
      `"${(habit?.name || "Unknown").replace(/"/g, '""')}"`,
      format(new Date(completion.completed_date), "MMM d, yyyy"),
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadFile(csvContent, `habit-history-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
}

// Export all data to PDF
export function exportToPDF(goals: Goal[], habits: Habit[], completions: HabitCompletion[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;
  const lineHeight = 7;
  const margin = 20;

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("GrowthPath Export", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128);
  doc.text(`Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, pageWidth / 2, yPosition, { align: "center" });
  doc.setTextColor(0);
  yPosition += 20;

  // Summary Stats
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, yPosition);
  yPosition += lineHeight + 3;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const completedGoals = goals.filter((g) => g.completed).length;
  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) 
    : 0;

  doc.text(`• Total Goals: ${goals.length} (${completedGoals} completed)`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`• Average Goal Progress: ${avgProgress}%`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`• Total Habits: ${habits.length}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`• Combined Streak: ${totalStreak} days`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`• Total Habit Check-ins: ${completions.length}`, margin, yPosition);
  yPosition += 15;

  // Goals Section
  checkNewPage(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Goals", margin, yPosition);
  yPosition += lineHeight + 3;

  if (goals.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128);
    doc.text("No goals created yet.", margin, yPosition);
    doc.setTextColor(0);
    yPosition += lineHeight + 5;
  } else {
    goals.forEach((goal) => {
      checkNewPage(25);
      
      // Goal title and progress
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const statusIcon = goal.completed ? "✓" : "○";
      doc.text(`${statusIcon} ${goal.title}`, margin, yPosition);
      
      // Progress bar visualization
      const progressBarWidth = 30;
      const progressBarHeight = 4;
      const progressBarX = pageWidth - margin - progressBarWidth;
      doc.setDrawColor(200);
      doc.setFillColor(240, 240, 240);
      doc.rect(progressBarX, yPosition - 3, progressBarWidth, progressBarHeight, "F");
      doc.setFillColor(goal.completed ? 34 : 99, goal.completed ? 197 : 102, goal.completed ? 94 : 241);
      doc.rect(progressBarX, yPosition - 3, (progressBarWidth * goal.progress) / 100, progressBarHeight, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${goal.progress}%`, progressBarX + progressBarWidth + 3, yPosition);
      yPosition += lineHeight;

      // Description
      if (goal.description) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const descLines = doc.splitTextToSize(goal.description, pageWidth - 2 * margin);
        doc.text(descLines.slice(0, 2), margin + 5, yPosition);
        yPosition += lineHeight * Math.min(descLines.length, 2);
        doc.setTextColor(0);
      }

      // Meta info
      doc.setFontSize(8);
      doc.setTextColor(150);
      const dueText = goal.due_date ? `Due: ${format(new Date(goal.due_date), "MMM d, yyyy")}` : "No deadline";
      doc.text(`${goal.category} • ${dueText}`, margin + 5, yPosition);
      doc.setTextColor(0);
      yPosition += lineHeight + 5;
    });
  }

  // Habits Section
  checkNewPage(40);
  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Habits", margin, yPosition);
  yPosition += lineHeight + 3;

  if (habits.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128);
    doc.text("No habits created yet.", margin, yPosition);
    doc.setTextColor(0);
    yPosition += lineHeight + 5;
  } else {
    habits.forEach((habit) => {
      checkNewPage(15);
      const habitCompletions = completions.filter((c) => c.habit_id === habit.id).length;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${habit.icon} ${habit.name}`, margin, yPosition);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`🔥 ${habit.streak} day streak • ${habitCompletions} total completions`, margin + 5, yPosition + lineHeight);
      doc.setTextColor(0);
      yPosition += lineHeight * 2 + 3;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${totalPages} • GrowthPath Export`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`growthpath-export-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

// Helper to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
