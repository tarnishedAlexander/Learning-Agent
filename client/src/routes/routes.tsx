// client/src/routes/routes.tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClassMenu } from "../pages/clasesMenu";
import { StudentsCurso } from "../pages/estudiantesPerClase";
import { StudentProfile } from "../pages/reforzamiento";
import Examenes from "../pages/examenes";
import Entrevistas from "../pages/entrevistas";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClassMenu />} />
        <Route path="curso/:id" element={<StudentsCurso />} />
        <Route path="/reforzamiento" element={<StudentProfile />} />
        <Route path="/examenes" element={<Examenes />} />
        <Route path="/entrevistas" element={<Entrevistas />} />
      </Routes>
    </BrowserRouter>
  );
};
