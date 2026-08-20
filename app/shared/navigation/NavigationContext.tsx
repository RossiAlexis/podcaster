import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useNavigate, useNavigation } from "react-router";

export type NavigationContextValue = {
  isPending: boolean;
  navigate: (href: string) => void;
};

export const NavigationContext = createContext<NavigationContextValue | null>(
  null,
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useNavigate();
  const navigation = useNavigation();
  const navigate = useCallback(
    (href: string) => void routerNavigate(href),
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
