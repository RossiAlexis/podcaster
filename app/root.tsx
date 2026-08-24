import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import stylesheet from "./app.css?url";
import { NavigationProvider } from "@/shared/navigation/NavigationContext";
import { AppLink } from "@/shared/navigation/AppLink";
import { NavigationIndicator } from "@/shared/navigation/NavigationIndicator";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const ONE_DAY = 24 * 60 * 60 * 1000;
const THEME_SCRIPT = `
  (() => {
    const storedTheme = localStorage.getItem("podcaster-theme");
    const isDark =
      storedTheme === "dark" ||
      (storedTheme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  })();
`;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_DAY,
      staleTime: ONE_DAY,
    },
  },
});
function QueryProvider({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  const asyncStoragePersister = createAsyncStoragePersister({
    storage: window ? window.localStorage : null,
    key: "podcaster-query-cache",
  });
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        maxAge: ONE_DAY,
        persister: asyncStoragePersister,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <NavigationProvider>
        <header className="border-b border-slate-200 bg-surface shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <AppLink className="text-brand-600" to="/">
              Podcaster
            </AppLink>
            <div className="grid grid-cols-[1.5rem_auto] items-center gap-3">
              <div className="flex size-6 items-center justify-center">
                <NavigationIndicator />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="h-screen">
          <Outlet />
        </div>
      </NavigationProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
