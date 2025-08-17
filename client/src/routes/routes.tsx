import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ClassMenu } from "../pages/clasesMenu"
import { StudentsCurso } from "../pages/estudiantesPerClase"
import Login from "../pages/Login"
import { DocumentsPage } from "../pages/repository/DocumentsPage"

export const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<DocumentsPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="curso/:id" element={<StudentsCurso />} />
    </Routes>
    </BrowserRouter>
  )
}