import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { StudentProfile } from "../pages/reinforcement";
import Exam from "../pages/exam";
import Interview from "../pages/interview";
import Login from "../pages/Login";
import ExamsCreatePage from "../pages/exams/ExamCreatePage";
import UploadPdfPage from "../pages/UploadPdfPage";
import { DocumentsPage } from "../pages/repository/DocumentsPage";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AiQuestionsPage from "../pages/exams/AiQuestionsPage";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas privadas */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/exams/create" replace />} />
            <Route path="/reinforcement" element={<StudentProfile />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/exams/create" element={<ExamsCreatePage />} />
            <Route path="/upload-pdf" element={<UploadPdfPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/exams/ai" element={<AiQuestionsPage />} />
            <Route path="*" element={<Navigate to="/exams/create" replace />} />
          </Route>
        </Route> 
      </Routes>
    </BrowserRouter>
  );
};
