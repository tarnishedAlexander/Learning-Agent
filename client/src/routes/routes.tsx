import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ClassMenu } from "../pages/clasesMenu";
import { StudentsCurso } from "../pages/estudiantesPerClase";
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

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/classes" element={<ClassMenu />} />
            <Route path="/classes/:id" element={<StudentsCurso />} />
            <Route path="/reinforcement" element={<StudentProfile />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/" element={<Navigate to="/exams/create" replace />} />
            <Route path="/exams/create" element={<ExamsCreatePage />} />
            <Route path="*" element={<Navigate to="/exams/create" replace />} />
            <Route path="/upload-pdf" element={<UploadPdfPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
