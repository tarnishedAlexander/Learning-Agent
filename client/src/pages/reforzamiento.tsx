// client/src/pages/reforzamiento.tsx
import { useState } from "react";
import { Card, Divider, Typography, Avatar, Layout, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

const containerStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto" };
// ahora usamos row con wrap para permitir dos cards lado a lado
const cardsContainerStyle: React.CSSProperties = {
  marginTop: 24,
  display: "flex",
  flexDirection: "row",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "stretch",
};
const cardWrapperStyle: React.CSSProperties = {
  flex: "1 1 45%", // toma hasta ~45% del ancho, permitiendo gap
  minWidth: 260,   // para que responda bien en pantallas pequeñas
  display: "flex", // para que el card ocupe toda la altura del wrapper
};
const cardBaseStyle: React.CSSProperties = {
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  minHeight: 84,
  width: "100%", // que el card ocupe todo el wrapper
};
const cardBodyStyle: React.CSSProperties = {
  padding: 20,
  display: "flex",
  alignItems: "center",
};
const textBlockStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "left",
  marginRight: 16,
};
const buttonWrapperStyle: React.CSSProperties = { display: "flex", alignItems: "center" };

export function StudentProfile() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Datos del estudiante
  const studentData = {
    name: "Juan Pérez",
    role: "Estudiante",
    subjects: ["Matemáticas", "Física", "Programación", "Historia"],
    aws: {
      exam: "Cuestionario sobre AWS",
      interview: "Simulación de entrevista sobre AWS",
    },
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Panel azul lateral */}
      <Sider
        width={300}
        style={{
          background: "#1890ff",
          padding: "24px",
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
        }}
      >
        {/* Perfil del estudiante */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar size={100} icon={<UserOutlined />} style={{ marginBottom: 16, backgroundColor: "#fff", color: "#1890ff" }} />
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            {studentData.name}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>{studentData.role}</Text>
        </div>

        <Divider style={{ borderColor: "rgba(255,255,255,0.3)" }} />

        {/* Lista de materias */}
        <div style={{ marginTop: 24 }}>
          <Title level={4} style={{ color: "#fff" }}>
            Materias
          </Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {studentData.subjects.map((subject, index) => (
              <Text
                key={index}
                style={{
                  color: activeSubject === subject ? "#fff" : "rgba(255,255,255,0.8)",
                  padding: "8px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: activeSubject === subject ? "rgba(255,255,255,0.2)" : "transparent",
                  transition: "all 0.3s",
                  fontWeight: activeSubject === subject ? "bold" : "normal",
                }}
                onClick={() => setActiveSubject(subject)}
              >
                {subject}
              </Text>
            ))}
          </div>
        </div>
      </Sider>

      {/* Contenido principal */}
      <Layout style={{ padding: "24px" }}>
        <Content>
          {/* Contenido principal centrado */}
          <div style={containerStyle}>
            <Title level={2}>AWS</Title>

            {/* Tarjetas en fila (responsive) */}
            <div style={cardsContainerStyle}>
              {/* Wrapper de Exámenes */}
              <div style={cardWrapperStyle}>
                <Link to="/examenes" style={{ textDecoration: "none", width: "100%" }}>
                  <Card hoverable role="button" aria-label="Ir a Exámenes" style={cardBaseStyle} bodyStyle={cardBodyStyle}>
                    <div style={textBlockStyle}>
                      <Title level={5} style={{ margin: 0, lineHeight: 1.1 }}>
                        Exámenes
                      </Title>
                      <Text type="secondary" style={{ marginTop: 6 }}>
                        {studentData.aws.exam}
                      </Text>
                    </div>

                    <div style={buttonWrapperStyle}>
                      <Button type="primary" style={{ minWidth: 56 }}>
                        Ir
                      </Button>
                    </div>
                  </Card>
                </Link>
              </div>

              {/* Wrapper de Entrevistas */}
              <div style={cardWrapperStyle}>
                <Link to="/entrevistas" style={{ textDecoration: "none", width: "100%" }}>
                  <Card hoverable role="button" aria-label="Ir a Entrevistas" style={cardBaseStyle} bodyStyle={cardBodyStyle}>
                    <div style={textBlockStyle}>
                      <Title level={5} style={{ margin: 0, lineHeight: 1.1 }}>
                        Entrevistas
                      </Title>
                      <Text type="secondary" style={{ marginTop: 6 }}>
                        {studentData.aws.interview}
                      </Text>
                    </div>

                    <div style={buttonWrapperStyle}>
                      <Button type="primary" style={{ minWidth: 56 }}>
                        Ir
                      </Button>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Sección de compartir pantalla */}
            <Divider style={{ marginTop: 48 }} />
            <div
              style={{
                background: "#f0f2f5",
                padding: 16,
                borderRadius: 8,
                marginTop: 24,
              }}
            >
              {/* Contenido adicional (vacío por ahora) */}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
