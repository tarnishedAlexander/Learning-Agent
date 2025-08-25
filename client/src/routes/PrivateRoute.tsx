import { Navigate, Outlet } from "react-router-dom";
import { readAuth } from "../utils/storage";

export default function PrivateRoute() {
  const { accessToken } = readAuth();
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}
