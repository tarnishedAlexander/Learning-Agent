import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "../../components/PageTemplate";
import TestModal from "../../components/tests/TestModal"; 
import { useStudentTest } from "../../hooks/useStudentTest";

import TestRunner from "../../components/tests/TestRunner"; 


export default function Test() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isTestModalOpen, closeTestModal, startExam, questionCount } = useStudentTest();
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);


  const handleStartExam = (count: number) => {
    startExam(count);
    setIsExamStarted(true);
    setCurrentQuestion(1);
  };

  const handleNextQuestion = () => {
    const total = questionCount || 0;
    if (currentQuestion < total) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      navigate(`/student/classes/${id}/reinforcement`);
    }
  };

  // const handleTimeUp = () => {
  //   navigate("/reinforcement");
  // };

  return (
    <PageTemplate
      title="Exams"
      subtitle={
        isExamStarted && questionCount
          ? `Question ${currentQuestion} of ${questionCount}`
          : "Soon you will find quizzes and resources to practice"
      }
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Classes", href: "/student/classes" },
        { label: "Reinforcement", href: `/student/classes/${id}/reinforcement` },
        { label: "Exams" },
      ]}
    >
      {!isExamStarted && (
        <TestModal
          open={isTestModalOpen}
          onClose={closeTestModal}
          onSelectDifficulty={handleStartExam}
        />
      )}


      {isExamStarted && (
        <div style={{ width: "100%", minHeight: 300 }}>
          <TestRunner onAnswered={handleNextQuestion} />
        </div>

      )}
    </PageTemplate>
  );
}
