import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext"
import { courseService } from "../services/course.service";
import type { Course } from "../interfaces/courseInterface";

const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const { user, fetchUser } = useUserContext();

    useEffect(() => {
        const prepareHook = async () => {
            if (!user) {
                await fetchUser();
            }
            await fetchCourses();
        };

        prepareHook();
    }, [user]);

    const getCourseByID = async (courseId: string) => {
        const res = await courseService.getCourseById(courseId);
        if (res.code == 200) {
            return {
                success: true,
                data: res.data
            }
        } else {
            return {
                sucess: false
            }
        }
    }

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
        await fetchCourses();
    }

    return {
        courses,
        getCourseByID,
        fetchCourses,
        createCourse,
    }
}

export default useCourses;