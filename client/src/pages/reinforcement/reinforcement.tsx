import React, { useState } from "react";
import { Typography, Layout, Modal, Space, Row, Col, Button } from "antd";
import { BookOutlined, FileTextOutlined } from "@ant-design/icons";
import { ProgressCard } from "../../components/reinforcement/ProgressCard";
import { CourseCards } from "../../components/reinforcement/CourseCards";
import { ChatModal } from "../../components/reinforcement/ChatModal";
import { useChatLogic } from "../../hooks/useChatLogic";
import { ChatFloatButton } from "../../components/reinforcement/ChatFloatButton";

export function Reinforcement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isChatOpen, handleChatClick, setIsChatOpen } = useChatLogic();

  const studentActivities = {
    courses: [
      { id: "exam", title: "Exámenes", description: "Preparación para exámenes y evaluaciones" },
      { id: "interview", title: "Entrevistas", description: "Preparación para entrevistas de trabajo" },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Layout className="min-h-screen bg-[#f5f7fa]">
        <Layout.Content className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <Typography.Title level={1} className="!text-[#1A2A80] !mb-2 text-4xl font-semibold">
                Refuerzo
              </Typography.Title>
              <Typography.Text className="!text-[#7A85C1] text-lg font-medium block !mb-8">
                Selecciona una categoría para practicar
              </Typography.Text>
            </div>
            <div className="absolute top-8 right-8 z-10">
              <Space>
                <Button
                  icon={<BookOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  size="middle"
                  className="!bg-[#1A2A80] !text-white !border-none h-9 rounded-lg font-medium px-4 shadow-md transition-all duration-200 ease-in-out hover:!bg-[#3B38A0] hover:shadow-xl hover:-translate-y-1"
                >
                  Sílabo
                </Button>
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  size="middle"
                  className="!bg-[#1A2A80] !text-white !border-none h-9 rounded-lg font-medium px-4 shadow-md transition-all duration-200 ease-in-out hover:!bg-[#3B38A0] hover:shadow-xl hover:-translate-y-1"
                >
                  Documentos
                </Button>
              </Space>
            </div>
            <Row className="mb-8">
              <ProgressCard />
            </Row>
            <CourseCards courses={studentActivities.courses} />
          </div>
          <ChatFloatButton onClick={handleChatClick} />
        </Layout.Content>
      </Layout>
      <Modal
        title="Funcionalidad en desarrollo"
        open={isModalOpen}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        footer={[<Button key="back" onClick={() => setIsModalOpen(false)}>Cerrar</Button>]}
      >
        <p>Esta funcionalidad aún está en desarrollo y estará disponible pronto.</p>
      </Modal>
      <ChatModal isChatOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}