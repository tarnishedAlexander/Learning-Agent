import type { createEnrollmentInterface, EnrollGroupRequest, EnrollGroupResponse, } from "../interfaces/enrollmentInterface";
import { enrollmentService } from "../services/enrollmentService";

const useEnrollment = () => {

    const enrollSingleStudent = async (enrollData: createEnrollmentInterface) => {
        const response = await enrollmentService.enrollStudentInClass(enrollData);
        return response;
    }

    const enrollGroupStudents = async (payload: EnrollGroupRequest): Promise<EnrollGroupResponse> => {
        const res = await enrollmentService.enrollGroupStudents(payload);
        const data: EnrollGroupResponse = res.data;
        return data
    }

    return {
        enrollSingleStudent, enrollGroupStudents
    }
}

export default useEnrollment;