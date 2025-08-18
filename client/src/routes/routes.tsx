import { BrowserRouter, Route, Routes, Navigate} from "react-router-dom";
import { ClassMenu } from "../pages/clasesMenu"
import { StudentsCurso } from "../pages/estudiantesPerClase"
import { StudentProfile } from "../pages/reinforcement";
import Exam from "../pages/exam";
import Interview from "../pages/interview";
import Login from "../pages/Login"
import ExamsCreatePage from "../pages/exams/ExamCreatePage";


export const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<ClassMenu/>}/>
      <Route path="/login" element={<Login />} />
      <Route path="curso/:id" element={<StudentsCurso />} />
      <Route path="/reinforcement" element={<StudentProfile />} />
      <Route path="/exam" element={<Exam />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/" element={<Navigate to="/exams/create" replace />} />
      <Route path="/exams/create" element={<ExamsCreatePage />} />
      <Route path="*" element={<Navigate to="/exams/create" replace />} />
    </Routes>

    </BrowserRouter>
  );
};
