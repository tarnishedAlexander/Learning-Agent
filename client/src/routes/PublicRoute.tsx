import { Navigate, Outlet } from "react-router-dom";
import { readAuth } from "../utils/storage";

export default function PublicRoute() {
  const { accessToken } = readAuth();
  return accessToken ? <Navigate to="/" replace /> : <Outlet />;
}
