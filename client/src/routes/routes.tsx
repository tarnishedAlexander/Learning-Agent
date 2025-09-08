import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ClassMenu } from "../pages/academic_management/ClassesMenu";
import { StudentsByClass } from "../pages/academic_management/StudentsByClass";
import { Reinforcement } from "../pages/reinforcement/reinforcement";
import Exam from "../pages/reinforcement/exam";
import Interview from "../pages/reinforcement/interview";
import Login from "../pages/Login";
import ForgotPasswordPage from "../pages/ForgotPassword";
import ExamsCreatePage from "../pages/exams/ExamCreatePage";
import ExamManagementPage from "../pages/exams/ExamManagementPage";
import UploadDocumentPage from "../pages/documents/UploadDocumentPage";
import { CourseDetailPage } from "../pages/academic_management/CourseDetailPage";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
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

            {/* Professor */}
            <Route path = "/professor"element={<RoleRoute allowed={["docente"]} />}> 
              <Route path="courses" element={<TeacherCoursePage />} />
              <Route path="courses/:courseId/periods" element={<CoursePeriodsPage />} />
              <Route path="exams/create" element={<ExamsCreatePage />} />
              <Route path="exams" element={<ExamManagementPage />} />
              <Route path="classes/:id/students" element={<StudentsByClass />} />
              <Route path="classes/:id" element={<CourseDetailPage />} />
            </Route>

            {/* Students */}
            <Route path = "/student" element={<RoleRoute allowed={["estudiante"]} />}> 
              <Route path="classes" element={<ClassMenu />} />
              <Route path="reinforcement" element={<Reinforcement />} />
              <Route path="exam" element={<Exam />} />
              <Route path="interview" element={<Interview />} />
            </Route>

            <Route path="/document" element={<UploadDocumentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
