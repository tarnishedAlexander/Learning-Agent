import type { createEnrollmentInterface } from "../interfaces/enrollmentInterface";
import { enrollmentService } from "../services/enrollmentService";

const useEnrollment = () => {

    const enrollSingleStudent = async (enrollData: createEnrollmentInterface) => {
        const response = await enrollmentService.enrollStudentInClass(enrollData);
        return response;
    }

    return {
        enrollSingleStudent,
    }
}

export default useEnrollment;