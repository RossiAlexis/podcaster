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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const ONE_DAY = 24 * 60 * 60 * 1000;

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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="text-brand-600 mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <AppLink to="/">Podcaster</AppLink>
            <NavigationIndicator />
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
