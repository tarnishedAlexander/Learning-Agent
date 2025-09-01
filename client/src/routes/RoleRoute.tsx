import { Navigate, Outlet } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

type RoleRouteProps = {
  allowed: string[];
  fallbackTo?: string;
};

export default function RoleRoute({ allowed, fallbackTo = "/" }: RoleRouteProps) {
  const { user } = useUserContext();

  if (!user) return <></>;
  const hasRole = user.roles?.some((r) => allowed.includes(r));
  return hasRole ? <Outlet /> : <Navigate to={fallbackTo} replace />;
}

