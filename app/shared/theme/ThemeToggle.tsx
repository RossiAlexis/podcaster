import { useEffect, useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "podcaster-theme";
const THEME_CHANGE_EVENT = "podcaster-theme-change";

type Theme = "light" | "dark" | "system";

const themes: readonly {
  icon: typeof SunIcon;
  label: string;
  value: Theme;
}[] = [
  { icon: SunIcon, label: "Light theme", value: "light" },
  { icon: MoonIcon, label: "Dark theme", value: "dark" },
  { icon: ComputerIcon, label: "System theme", value: "system" },
];

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function persistTheme(theme: Theme) {
  if (theme === "system") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : "system";
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const selectTheme = (nextTheme: Theme) => {
    persistTheme(nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <div
      aria-label="Color theme"
      className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
      role="group"
    >
      {themes.map(({ icon: Icon, label, value }) => (
        <button
          aria-label={label}
          aria-pressed={theme === value}
          className="flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:text-slate-900 aria-pressed:bg-surface aria-pressed:text-brand-600 aria-pressed:shadow-sm"
          key={value}
          onClick={() => selectTheme(value)}
          title={label}
          type="button"
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

type IconProps = {
  className?: string;
};

function SunIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20.7 13.1A8.5 8.5 0 1 1 10.9 3.3 6.5 6.5 0 0 0 20.7 13.1Z" />
    </svg>
  );
}

function ComputerIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect height="14" rx="2" width="20" x="2" y="3" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
