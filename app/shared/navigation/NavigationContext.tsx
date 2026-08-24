import { createContext, useCallback, type ReactNode } from "react";
import { useNavigate, useNavigation, type NavigateOptions } from "react-router";

export type NavigationContextValue = {
  isPending: boolean;
  navigate: (href: string, options?: NavigateOptions) => void;
};

export const NavigationContext = createContext<NavigationContextValue | null>(
  null,
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useNavigate();
  const navigation = useNavigation();
  const navigate = useCallback(
    (href: string, options?: NavigateOptions) =>
      void routerNavigate(href, options),
    [routerNavigate],
  );
  return (
    <NavigationContext.Provider
      value={{ isPending: navigation.state !== "idle", navigate }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
