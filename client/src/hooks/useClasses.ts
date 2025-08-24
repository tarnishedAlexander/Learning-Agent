import { useEffect, useState } from "react"
import { claseService } from "../services/classesService"
import { useClaseStore } from "../store/claseStore";
import type { Clase } from "../interfaces/claseInterface";
import { v4 as uuidv4 } from "uuid";
import { studentService } from "../services/studentService";
import type { StudentInfo } from "../interfaces/studentInterface";
import { useUserContext } from "../context/UserContext";

const useClasses = () => {
  const { clases, setClases, addClase } = useClaseStore();
  const [objClass, setObjClass] = useState<Clase>();
  const [curso, setCurso] = useState('')
  const [students, setStudents] = useState<StudentInfo[]>([])
  const { user, fetchUser } = useUserContext();

  /*
  const fetchUser = async () => {
    const authData = localStorage.getItem("auth");
    if (!authData) {
      console.log("Sin datos Auth guardados en localstorage");
      return;
    }
    const parsedData = JSON.parse(authData);
    const user = await meAPI(parsedData.accessToken);
    setUserData(user);
  };*/

  useEffect(() => {
    fetchClases();
    if (!user || user === null) {
      fetchUser();
    }
  }, []);

  const fetchClases = async () => {
    const data = await claseService.getClases();
    setClases(data);
  };

  const createClass = async (newClase: Omit<Clase, 'id'>) => {
    const objClass = await claseService.createClase(newClase);
    addClase(objClass)
  }

  const fetchClase = async (id: string) => {
    const curso = await claseService.getClaseById(id)
    setObjClass(curso);
    setCurso(curso.name)
    const students = await studentService.getStudentsByClassId(id)
    setStudents(students)
  }

  const createStudents = async (newStudentGroup: Omit<StudentInfo, 'id'>) => {
    const newStudents = {
      ...newStudentGroup,
      id: uuidv4()
    }
    //await studentService.createStudentGroup(newStudents)
    //setStudents(newStudents)
  }

  const updateClass = async (values: Clase) => {
    try {
      const id = values.id;
      const classData = {
        name: values.name, 
        semester: values.semester, 
        teacherId: values.teacherId, 
        dateBegin: values.dateBegin, 
        dateEnd: values.dateEnd
      }
      claseService.updateClase(id, classData)
    } catch {
      console.error(`Error updating class with id ${values.id}`)
    }
  }

  const softDeleteClass = async (classId: string) => {
    try {
      const userId = user?.id || "";
      return await claseService.softDeleteClase(classId, userId);
    } catch (error) {
      console.error(`Error deleting class with id ${classId}`)
    }
  }

  return {
    clases,
    fetchClases,
    createClass,
    fetchClase,
    objClass,
    curso,
    students,
    createStudents,
    updateClass,
    softDeleteClass,
  };
}

export default useClasses