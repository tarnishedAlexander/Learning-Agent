import { useEffect, useState } from "react"
import type { StudentInfo } from "../interfaces/studentInterface"
import { useUserContext } from "../context/UserContext";
import { studentService } from "../services/student.service";

const useStudents = () => {
    const [students, setStudents] = useState<StudentInfo>();
    const { user, fetchUser } = useUserContext();

    useEffect(() => {
        const prepareHook = async () => {
            if (!user) {
                await fetchUser();
            }
        }
        prepareHook();
    }, [user]);

    const fetchStudentsByClass = async (classId: string) => {
        const res = await studentService.getStudentsByClassId(classId);
        if (res.code == 200) {
            setStudents(res.data);
            return {
                success: true,
                message: "Estudiantes recuperados exitosamente"
            }
        } else {
            return {
                success: false,
                message: res.error
            }
        }
    }

    return {
        students,
        fetchStudentsByClass,
    }
}

export default useStudents;