import { Modal, Button, Typography, Space, Divider } from "antd";
import { BookOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

export function TestModal({ open, onClose, onSelectDifficulty }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      bodyStyle={{
        padding: 28,
        background: "#fff",
        borderRadius: 12,
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <Title
            level={4}
            style={{
              marginBottom: 4,
              color: "#1A2A80",
              fontWeight: 600,
            }}
          >
            <BookOutlined style={{ marginRight: 8, color: "#1A2A80" }} />
            Creación de examen
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Selecciona la dificultad para comenzar tu prueba
          </Text>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        <Space
          direction="horizontal"
          size="middle"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Button
            size="middle"
            className="!bg-[#1A2A80] !text-white !border-none h-9 rounded-lg font-medium shadow-md transition-all duration-200 ease-in-out hover:!bg-[#3B38A0] hover:shadow-lg hover:-translate-y-0.5"
            icon={<BookOutlined />}
            onClick={() => onSelectDifficulty(5)}
          >
            Fácil — 5
          </Button>

          <Button
            size="middle"
            className="!bg-[#1A2A80] !text-white !border-none h-9 rounded-lg font-medium shadow-md transition-all duration-200 ease-in-out hover:!bg-[#3B38A0] hover:shadow-lg hover:-translate-y-0.5"
            icon={<BookOutlined />}
            onClick={() => onSelectDifficulty(7)}
          >
            Medio — 7
          </Button>

          <Button
            size="middle"
            className="!bg-[#1A2A80] !text-white !border-none h-9 rounded-lg font-medium shadow-md transition-all duration-200 ease-in-out hover:!bg-[#3B38A0] hover:shadow-lg hover:-translate-y-0.5"
            icon={<BookOutlined />}
            onClick={() => onSelectDifficulty(10)}
          >
            Difícil — 10
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
