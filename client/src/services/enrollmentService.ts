import { apiClient } from "../api/apiClient";
import type { createEnrollmentInterface } from "../interfaces/enrollmentInterface";

export const enrollmentService = {
    async enrollStudentInClass(enrollData: createEnrollmentInterface ) {
        try {
            const response = await apiClient.post(`/academic/enrollments/single-student`, enrollData);
            return response.data;
        } catch (error) {
            console.error("Failed to enroll student in class", error);
            throw error;
        }
    }
}