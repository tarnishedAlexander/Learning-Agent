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
    if (res.code == 201) {
      console.log("Clase recuperada:", res.data)
      setActualClass(res.data)
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
  }
  
  //TODO - Revisar esta funcionalidad
  const updateClass = async (values: Clase) => {
    try {
      if (!values.id) return;
      const updatedClass = await classService.updateClass(values.id, values);
      setActualClass(updatedClass);
      return updatedClass;
    } catch (error) {
      console.error("Error updating class", error);
      throw error;
    }
  }

  //TODO - Revisar esta también 
  const softDeleteClass = async (classId: string) => {
    try {
      const deleteResult = await classService.softDeleteClase(classId, user?.id || "")
      return deleteResult;
    } catch (error) {
      console.error(`Error soft deleting class with id ${classId}`, error);
      throw error;
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
