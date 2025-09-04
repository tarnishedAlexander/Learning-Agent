import { useState, useEffect, useCallback } from "react";

export function useStudentTest() {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const openTestModal = useCallback(() => {
    setIsTestModalOpen(true);
  }, []);

  const closeTestModal = useCallback(() => {
    setIsTestModalOpen(false);
  }, []);

  const startExam = useCallback((questionCount) => {
    console.log(`Iniciando examen con ${questionCount} preguntas`);
    setIsTestModalOpen(false);
  }, []);

  useEffect(() => {
    openTestModal();
  }, [openTestModal]);

  return {
    isTestModalOpen,
    openTestModal,
    closeTestModal,
    startExam,
  };
}
