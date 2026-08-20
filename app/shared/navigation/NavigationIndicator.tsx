import { useAppNavigation } from "@/shared/navigation/UseAppNavigation";

export function NavigationIndicator() {
  const { isPending } = useAppNavigation();
  if (!isPending) return null;

  return (
    <div
      aria-label="Loading page"
      className="fixed right-5 top-5 z-50 size-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
      role="status"
    />
  );
}
