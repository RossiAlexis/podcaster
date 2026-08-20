import type { ReactNode } from "react";
import { useAppNavigation } from "@/shared/navigation/UseAppNavigation";

export function AppLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const { navigate } = useAppNavigation();
  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}
