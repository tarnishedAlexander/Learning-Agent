import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ClassMenu } from "../pages/academic_management/ClassesMenu";
import { StudentsByClass } from "../pages/academic_management/StudentsByClass";
import { StudentProfile } from "../pages/reinforcement";
import Exam from "../pages/exam";
import Interview from "../pages/interview";
import Login from "../pages/Login";
import ForgotPasswordPage from "../pages/ForgotPassword";
import ExamsCreatePage from "../pages/exams/ExamCreatePage";
import UploadPdfPage from "../pages/UploadPdfPage";
import { CourseDetailPage } from "../pages/academic_management/CourseDetailPage";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import SettingsPage from "../pages/settings/SettingsPage";
import { TeacherCoursePage } from "../pages/courses/TeacherCoursePage";
import { CoursePeriodsPage } from "../pages/courses/CoursePeriodsPage";
export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          {/* <Route path="/register" element={<Register />} /> */}
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="/courses" element={<TeacherCoursePage />} />
            <Route path="/courses/:courseId/periods" element={<CoursePeriodsPage />} />
            <Route path="/classes" element={<ClassMenu />} />
            <Route path="/classes/:id" element={<CourseDetailPage />} />
            <Route path="/reinforcement" element={<StudentProfile />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/" element={<Navigate to="/exams/create" replace />} />
            <Route path="/exams/create" element={<ExamsCreatePage />} />
            <Route path="*" element={<Navigate to="/exams/create" replace />} />

            <Route path="/upload-pdf" element={<UploadPdfPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};