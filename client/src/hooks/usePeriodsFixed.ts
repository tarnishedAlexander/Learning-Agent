import { useState } from "react";
import { claseService } from "../services/classesService";
import type { Clase } from "../interfaces/claseInterface";
import { message } from "antd";

const usePeriods = () => {
  const [periods, setPeriods] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPeriodsByCourse = async (courseId: string) => {
    setLoading(true);
    try {
      // En el futuro, cuando el backend tenga el endpoint:
      // const periodsData = await claseService.getClasesByCourseId(courseId);
      
      // Por ahora, obtener todas las clases y filtrar (simulación)
      const allClasses = await claseService.getClases();
      
      // NOTA: Cuando el backend implemente la relación courseId en Classes, 
      // podremos filtrar adecuadamente: allClasses.filter(c => c.courseId === courseId)
      console.log(`Fetching periods for courseId: ${courseId}`); // Uso temporal del parámetro
      setPeriods(allClasses);
      return allClasses;
    } catch (error) {
      message.error("Error al cargar los períodos");
      console.error("Error fetching periods:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createPeriod = async (periodData: Omit<Clase, "id">) => {
    try {
      const newPeriod = await claseService.createClase(periodData);
      setPeriods(prev => [...prev, newPeriod]);
      return newPeriod;
    } catch (error) {
      message.error("Error al crear el período");
      console.error("Error creating period:", error);
      throw error;
    }
  };

  return {
    periods,
    loading,
    fetchPeriodsByCourse,
    createPeriod,
  };
};

export default usePeriods;
