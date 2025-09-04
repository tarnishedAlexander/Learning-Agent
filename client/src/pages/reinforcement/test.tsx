import { Card, Typography, Button, Space } from "antd";
import { Link } from "react-router-dom";
import PageTemplate from "../../components/PageTemplate";
import { TestModal } from "../../components/tests/TestModal";
import { useStudentTest } from "../../hooks/useStudentTest";

const { Title, Text } = Typography;

export default function Test() {
  const { isTestModalOpen, closeTestModal, startExam } = useStudentTest();

  return (
    <PageTemplate
      title="Exámenes"
      subtitle="Próximamente encontrarás cuestionarios y recursos para practicar"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Refuerzo", href: "/reinforcement" },
        { label: "Exámenes" }
      ]}
    >
      <TestModal
        open={isTestModalOpen}
        onClose={closeTestModal}
        onSelectDifficulty={startExam}
      />
    </PageTemplate>
  );
}
