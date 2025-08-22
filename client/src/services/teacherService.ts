import { apiClient } from "../api/apiClient";
import type { TeacherInfo } from "../interfaces/teacherInterface";

export const teacherService = {

    async getTeacherInfoById(teacherId: string): Promise<TeacherInfo> {
        try {
            const res = await apiClient.get(`academic/teacher/${teacherId}`);
            return res.data
        } catch (error) {
            console.error("Failed to fetch teacher by classId", error);
            throw error;
        }
    }
}

