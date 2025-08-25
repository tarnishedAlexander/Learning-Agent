import { teacherService } from "../services/teacherService";
import type { TeacherInfo } from "../interfaces/teacherInterface";

const useTeacher = () => {
    const getTeacherInfoById = async (teacherId: string) => {
        try {
            const data: TeacherInfo = await teacherService.getTeacherInfoById(teacherId)
            return data
        } catch (error) {
            console.error("Error al obtener información del docente",error)
        }
    };

    return {
        getTeacherInfoById,
    }
}

export default useTeacher