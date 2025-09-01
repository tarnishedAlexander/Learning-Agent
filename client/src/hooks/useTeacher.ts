import { teacherService } from "../services/teacherService";
import type { TeacherInfo } from "../interfaces/teacherInterface";

const useTeacher = () => {
    const getTeacherInfoById = async (teacherId: string) => {
        try {
            const res = await teacherService.getTeacherInfoById(teacherId)
            if (res.code == 200) {
                const teacher: TeacherInfo = res.data
                return {
                    success: true,
                    data: teacher
                }
            } else {
                return {
                    success: false
                }
            }
        } catch (error) {
            console.error("Error al obtener información del docente",error)
        }
    };

    return {
        getTeacherInfoById,
    }
}

export default useTeacher