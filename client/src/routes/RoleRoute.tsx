import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../store/userStore";

type RoleRouteProps = {
  allowed: string[];
  fallbackTo?: string;
};

export default function RoleRoute({ allowed, fallbackTo = "/" }: RoleRouteProps) {
  const user = useUserStore((s) => s.user);
  if (!user) return <></>;
  const hasRole = user.roles?.some((r) => allowed.includes(r));
  return hasRole ? <Outlet /> : <Navigate to={fallbackTo} replace />;
}
