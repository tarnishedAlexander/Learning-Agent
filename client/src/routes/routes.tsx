import { BrowserRouter, Route, Routes, Navigate} from "react-router-dom";
import ExamsCreatePage from "../pages/exams/ExamCreatePage";
//import { ClassMenu } from "../pages/clasesMenu"
//import { StudentsCurso } from "../pages/estudiantesPerClase"
//import Login from "../pages/Login"

export function AppRoutes  () {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/exams/create" replace />} />
      <Route path="/exams/create" element={<ExamsCreatePage />} />
      <Route path="*" element={<Navigate to="/exams/create" replace />} />
    </Routes>
    </BrowserRouter>
  );
}