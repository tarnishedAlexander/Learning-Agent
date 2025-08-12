import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ClassMenu } from "../pages/clasesMenu"
import { StudentsCurso } from "../pages/estudiantesPerClase"

export const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<ClassMenu/>}/>
      <Route path="curso/:id" element={<StudentsCurso />} />
    </Routes>
    </BrowserRouter>
  )
}