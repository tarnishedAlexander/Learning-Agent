import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClassMenu } from "../pages/clasesMenu";
import { StudentsCurso } from "../pages/estudiantesPerClase";
import Login from "../pages/Login";
import FileRepository from "../pages/FileRepository";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClassMenu />} />
        <Route path="/login" element={<Login />} />
        <Route path="curso/:id" element={<StudentsCurso />} />
        <Route path="/filerepository" element={<FileRepository />} />
      </Routes>
    </BrowserRouter>
  );
};
