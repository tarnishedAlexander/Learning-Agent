// client/src/pages/reforzamiento.tsx
import { useState } from "react";
import { Card, Divider, Typography, Avatar, Layout, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

export function StudentProfile() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Datos del estudiante
  const studentData = {
    name: "Juan Pérez",
    role: "Estudiante",
    subjects: ["Matemáticas", "Física", "Programación", "Historia"],
    aws: {
      exam: "Cuestionario sobre AWS",
      interview: "Simulación de entrevista sobre AWS"
    }
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
          left: 0
        }}
      >
        {/* Perfil del estudiante */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar size={100} icon={<UserOutlined />} style={{ marginBottom: 16, backgroundColor: "#fff", color: "#1890ff" }} />
          <Title level={3} style={{ color: "#fff", margin: 0 }}>{studentData.name}</Title>
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>{studentData.role}</Text>
        </div>

        <Divider style={{ borderColor: "rgba(255,255,255,0.3)" }} />

        {/* Lista de materias */}
        <div style={{ marginTop: 24 }}>
          <Title level={4} style={{ color: "#fff" }}>Materias</Title>
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
                  fontWeight: activeSubject === subject ? "bold" : "normal"
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
          {/* Contenedor principal dividido en 2 columnas:
              - left: contenido principal (flex-1)
              - right: panel con los dos cuadros (fixed width) */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            {/* Columna izquierda: contenido principal */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title level={2}>AWS</Title>

              <div style={{ marginTop: 24 }}>
                <Card style={{ borderRadius: 10, marginBottom: 16 }}>
                  <Title level={5}>Exámenes</Title>
                  <Text>{studentData.aws.exam}</Text>
                </Card>
                <Card style={{ borderRadius: 10 }}>
                  <Title level={5}>Entrevistas</Title>
                  <Text>{studentData.aws.interview}</Text>
                </Card>
              </div>

              {/* Sección de compartir pantalla */}
              <Divider style={{ marginTop: 48 }} />
              <div style={{ 
                background: "#f0f2f5", 
                padding: 16, 
                borderRadius: 8,
                marginTop: 24
              }}>
                {/* Contenido adicional (vacío por ahora) */}
              </div>
            </div>

            {/* Columna derecha: dos cuadros presionables */}
            <aside
              style={{
                width: 320,
                minWidth: 220,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Card clickable: Exámenes */}
              <Link to="/examenes" style={{ textDecoration: "none" }}>
                <Card
                  hoverable
                  role="button"
                  aria-label="Ir a Exámenes"
                  style={{
                    borderRadius: 12,
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Exámenes</Title>
                      <Text type="secondary">Repasa cuestionarios y pruebas</Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Button type="primary">Ir</Button>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Card clickable: Entrevistas */}
              <Link to="/entrevistas" style={{ textDecoration: "none" }}>
                <Card
                  hoverable
                  role="button"
                  aria-label="Ir a Entrevistas"
                  style={{
                    borderRadius: 12,
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Entrevistas</Title>
                      <Text type="secondary">Simulaciones y consejos</Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Button type="primary">Ir</Button>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Texto de ayuda */}
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Haz clic en cualquiera de los cuadros para abrir la página correspondiente.
                </Text>
              </div>
            </aside>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
