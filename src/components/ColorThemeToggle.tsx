import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/hooks/useThemePreference";

type ColorTheme = "teal" | "orange" | "purple" | "blue" | "rose";

const COLOR_THEMES: { id: ColorTheme; name: string; color: string }[] = [
  { id: "teal", name: "Matte Green", color: "bg-[hsl(158,50%,38%)]" },
  { id: "orange", name: "Sunset", color: "bg-[hsl(18,85%,52%)]" },
  { id: "purple", name: "Purple", color: "bg-[hsl(262,72%,55%)]" },
  { id: "blue", name: "Ocean", color: "bg-[hsl(210,85%,50%)]" },
  { id: "rose", name: "Rose", color: "bg-[hsl(342,78%,52%)]" },
];

export function ColorThemeToggle() {
  const { colorTheme, setColorTheme } = useThemePreference();

  const currentTheme = COLOR_THEMES.find((t) => t.id === colorTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl">
          <div className={cn("w-5 h-5 rounded-full transition-colors", currentTheme?.color)} />
          <span className="sr-only">Toggle color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover min-w-[140px]">
        {COLOR_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setColorTheme(theme.id)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              colorTheme === theme.id && "bg-muted"
            )}
          >
            <div className={cn("w-4 h-4 rounded-full", theme.color)} />
            <span>{theme.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
