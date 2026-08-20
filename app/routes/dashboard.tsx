import { AppLink } from "@/shared/navigation/AppLink";

export default function Dashboard() {
  return (
    <>
      <h1>Dashboard page</h1>
      <AppLink to="/podcast/123">go to podcast 123</AppLink>
    </>
  );
}
