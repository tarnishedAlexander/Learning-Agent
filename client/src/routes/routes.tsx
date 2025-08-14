import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ClassMenu } from "../pages/clasesMenu"
import { StudentsCurso } from "../pages/estudiantesPerClase"
import { StudentProfile } from "../pages/reforzamiento"

export const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<ClassMenu/>}/>
      <Route path="curso/:id" element={<StudentsCurso />} />
      <Route path="/reforzamiento" element={<StudentProfile />} />
    </Routes>
    </BrowserRouter>
  )
}