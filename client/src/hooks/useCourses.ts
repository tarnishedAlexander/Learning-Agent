import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext"
import { courseService } from "../services/course.service";
import type { Course } from "../interfaces/courseInterface";

const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const { user, fetchUser } = useUserContext();

    useEffect(() => {
        const prepareHook = async () => {
            if (!user || user === null) {
                await fetchUser();
            }
        }
        
        prepareHook();
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        if (!user) return
        const data = await courseService.getCourseByTeacher(user.id)
        setCourses(data);
    }

    const createCourse = async (name: string) => {
        if (!user) return
        const req = {
            name,
            teacherId: user.id
        }
        await courseService.createCourse(req);   
    }

    return {
        courses,
        fetchCourses,
        createCourse,
    }
}

export default useCourses;