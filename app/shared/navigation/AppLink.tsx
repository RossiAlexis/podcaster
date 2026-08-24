import type { ReactNode } from "react";
import { useHref } from "react-router";
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
  const href = useHref(to);

  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}
