import { useEffect, useState } from "react"
import { claseService } from "../services/classesService"
import { useClaseStore } from "../store/claseStore";
import type { Clase } from "../interfaces/claseInterface";
import { v4 as uuidv4 } from "uuid";
import { studentService } from "../services/studentService";
import type { StudentGroup } from "../interfaces/studentInterface";

const useClasses = () =>{
const { clases, setClases,addClase } = useClaseStore();
const [curso,setCurso]=useState('')
const [students,setStudents]=useState<StudentGroup|null>(null)
  useEffect(() => {
    fetchClases();
  }, []);

  const fetchClases = async () => {
    const data = await claseService.getClases();
    setClases(data);
  };

  const addClases = async (newClase: Omit<Clase,'id'>) =>{
    const claseToAdd = {
      ...newClase,
      id:uuidv4()
    }
    await claseService.createClase(claseToAdd);
    addClase(claseToAdd)

  }

  const fetchClase = async (id:string)=>{
    const curso = await claseService.getClaseById(id)
    const students = await studentService.getStudentGroupById(id)
    setCurso(curso.Name)
    setStudents(students)
  }

  const createStudents=async (newStudentGroup:Omit<StudentGroup,'id'>)=>{
    const newStudents={
      ...newStudentGroup,
      id:uuidv4()
    }
    await studentService.createStudentGroup(newStudents)
    setStudents(newStudents)
  }

  return {
    clases,
    fetchClases,
    addClases,
    fetchClase,
    curso,
    students,
    createStudents
  };
}

export default useClasses