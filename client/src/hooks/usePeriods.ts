import { useState, useCallback } from "react";
import { claseService, getPeriodsByCourse } from "../services/classesService";
import type { Clase } from "../interfaces/claseInterface";
import { message } from "antd";

const usePeriods = () => {
  const [periods, setPeriods] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPeriodsByCourse = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      const periodsData = await getPeriodsByCourse(courseId);
      setPeriods(periodsData);
      return periodsData;
    } catch (error) {
      message.error("Error al cargar los períodos");
      console.error("Error fetching periods:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPeriod = async (periodData: Omit<Clase, "id">) => {
    try {
      const newPeriod = await claseService.createClase(periodData);
      setPeriods(prev => Array.isArray(prev) ? [...prev, newPeriod] : [newPeriod]);
      message.success("Período creado exitosamente");
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
