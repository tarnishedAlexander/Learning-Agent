import { useEffect, useState } from "react"
import { classService } from "../services/classes.service";
import type { Clase, CreateClassDTO } from "../interfaces/claseInterface";
import { useUserContext } from "../context/UserContext";

const useClasses = () => {
  const [actualClass, setActualClass] = useState<Clase>();
  const [classes, setClasses] = useState<Clase[]>([]);
  const { user, fetchUser } = useUserContext();

  useEffect(() => {
    const prepareHook = async () => {
      if (!user) {
        await fetchUser();
      }
    }
    prepareHook();
  }, [user]);

  const fetchClassesByCourse = async (courseId: string) => {
    if (!user) {
      return {
        success: false,
        message: "Ha ocurrido un error, inténtelo de nuevo"
      }
    }

    const res = await classService.getClassesByCourseId(courseId);
    if (res.code == 200) {
      setClasses(res.data)
      return {
        success: true,
        message: "Períodos recuperados exitosamente"
      }
    }
  };

  const createClass = async (data: Omit<CreateClassDTO, 'teacherId'>) => {
    if (!user) {
      return {
        success: false,
        message: "Ha ocurrido un error, inténtelo de nuevo"
      }
    }

    const newClass = { ...data, teacherId: user.id }
    const res = await classService.createClass(newClass);

    if (res.code == 201) {
      return {
        success: true,
        message: "Período creado exitosamente"
      }
    } else {
      return {
        success: false,
        message: res.error
      }
    }
  };

  const fetchClassById = async (classId: string) => {
    const res = await classService.getClassById(classId);
    if (res.code == 200) {
      setActualClass(res.data)
      return {
        success: true,
        message: "Clase recuperada exitosamente"
      }
    } else {
      return {
        success: false,
        message: res.error
      }
    }
  }

  const updateClass = async (values: Clase) => {
    if (!values.id || !user) {
      return {
        success: false,
        message: "Ha ocurrido un error, inténtelo de nuevo"
      }
    }
    const res = await classService.updateClass(values.id, values);
    if (res.code == 201) {
      setActualClass(res.data)
      return {
        success: true,
        message: "Clase actualizada exitosamente"
      }
    } else {
      return {
        success: false,
        message: res.error
      }
    }
  }

  const softDeleteClass = async (classId: string) => {
    if (!classId || !user) {
      return {
        success: false,
        message: "Ha ocurrido un error, inténtelo de nuevo"
      }
    }
    const res = await classService.softDeleteClase(classId, user.id);
    if (res.code == 201) {
      setActualClass(res.data)
      return {
        success: true,
        message: "Clase eliminada exitosamente"
      }
    } else {
      return {
        success: false,
        message: res.error
      }
    }
  }

  return {
    actualClass,
    classes,
    fetchClassesByCourse,
    createClass,
    fetchClassById,
    updateClass,
    softDeleteClass,
  }
}

export default useClasses
