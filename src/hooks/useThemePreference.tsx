import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ColorTheme = "teal" | "orange" | "purple" | "blue" | "rose";

export function useThemePreference() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>("teal");
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preferences from database when user logs in
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("theme_preference, color_theme")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error loading theme preferences:", error);
          setIsLoading(false);
          return;
        }

        if (data) {
          // Apply theme preference
          if (data.theme_preference && data.theme_preference !== theme) {
            setTheme(data.theme_preference);
          }

          // Apply color theme
          if (data.color_theme) {
            applyColorTheme(data.color_theme as ColorTheme);
            setColorTheme(data.color_theme as ColorTheme);
          }
        }
      } catch (err) {
        console.error("Error loading theme preferences:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save theme preference to database
  const saveThemePreference = async (newTheme: string) => {
    setTheme(newTheme);
    
    if (!user) return;

    try {
      await supabase
        .from("profiles")
        .update({ theme_preference: newTheme, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } catch (err) {
      console.error("Error saving theme preference:", err);
    }
  };

  // Save color theme to database
  const saveColorTheme = async (newColorTheme: ColorTheme) => {
    applyColorTheme(newColorTheme);
    setColorTheme(newColorTheme);
    
    if (!user) return;

    try {
      await supabase
        .from("profiles")
        .update({ color_theme: newColorTheme, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } catch (err) {
      console.error("Error saving color theme:", err);
    }
  };

  // Apply color theme to DOM
  const applyColorTheme = (theme: ColorTheme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-orange", "theme-purple", "theme-blue", "theme-rose");
    
    // Add new theme class if not default
    if (theme !== "teal") {
      root.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem("color-theme", theme);
  };

  return {
    theme,
    colorTheme,
    isLoading,
    setThemePreference: saveThemePreference,
    setColorTheme: saveColorTheme,
  };
}
