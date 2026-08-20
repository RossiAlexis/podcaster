import { useContext } from "react";
import {
  NavigationContext,
  type NavigationContextValue,
} from "@/shared/navigation/NavigationContext";

export function useAppNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useAppNavigation must be used inside NavigationProvider");
  }
  return context;
}
