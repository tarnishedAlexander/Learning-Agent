// client/src/pages/reforzamiento.tsx
import { useState } from "react";
import { Card, Divider, Typography, Avatar, Layout, Button, FloatButton } from "antd";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

const containerStyle: React.CSSProperties = { 
  maxWidth: 980, 
  margin: "0 auto",
  position: "relative"
};

const cardsContainerStyle: React.CSSProperties = {
  marginTop: 24,
  display: "flex",
  flexDirection: "row",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const cardWrapperStyle: React.CSSProperties = {
  flex: "1 1 45%",
  minWidth: 260,
  display: "flex",
};

const cardBaseStyle: React.CSSProperties = {
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  minHeight: 250,
  width: "100%",
  background: "linear-gradient(135deg, #B2B0E8 0%, #9E9CD9 100%)",
  transition: "transform 0.3s, box-shadow 0.3s",
};

const cardHoverStyle: React.CSSProperties = {
  transform: "translateY(-5px)",
  boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
};

const cardBodyStyle: React.CSSProperties = {
  padding: 20,
  display: "flex",
  alignItems: "center",
  height: "100%",
};

const textBlockStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "left",
  marginRight: 16,
};

const siderStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #3B38A0 0%, #2A277A 100%)",
  padding: "24px",
  height: "100vh",
  position: "sticky",
  top: 0,
  left: 0,
  boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
};

const subjectItemStyle = (isActive: boolean): React.CSSProperties => ({
  color: isActive ? "#fff" : "rgba(255,255,255,0.8)",
  padding: "8px 12px",
  borderRadius: 4,
  cursor: "pointer",
  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
  transition: "all 0.3s",
  fontWeight: isActive ? "bold" : "normal",
});

export function StudentProfile() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const studentData = {
    name: "Juan Pérez",
    role: "Estudiante",
    subjects: ["Matemáticas", "Física", "Programación", "Historia"],
    aws: {
      exam: "Cuestionario sobre AWS",
      interview: "Simulación de entrevista sobre AWS",
    },
  };

  const handleCardHover = (cardType: string) => {
    setHoveredCard(cardType);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={300} style={siderStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar 
            size={100} 
            icon={<UserOutlined />} 
            style={{ 
              marginBottom: 16, 
              backgroundColor: "#fff", 
              color: "#3B38A0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)" 
            }} 
          />
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            {studentData.name}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
            {studentData.role}
          </Text>
        </div>

        <Divider style={{ borderColor: "rgba(255,255,255,0.3)" }} />

        <div style={{ marginTop: 24 }}>
          <Title level={4} style={{ color: "#fff", marginBottom: 16 }}>
            Materias
          </Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {studentData.subjects.map((subject, index) => (
              <Text
                key={index}
                style={subjectItemStyle(activeSubject === subject)}
                onClick={() => setActiveSubject(subject)}
              >
                {subject}
              </Text>
            ))}
          </div>
        </div>
      </Sider>

      <Layout style={{ padding: "24px", background: "#f8f9fa" }}>
        <Content>
          <div style={containerStyle}>
            <Title level={2} style={{ color: "#3B38A0", marginBottom: 24 }}>
              AWS
            </Title>

            <div style={cardsContainerStyle}>
              <div style={cardWrapperStyle}>
                <Link 
                  to="/examenes" 
                  style={{ textDecoration: "none", width: "100%" }}
                  onMouseEnter={() => handleCardHover("exam")}
                  onMouseLeave={handleCardLeave}
                >
                  <Card 
                    hoverable 
                    role="button" 
                    aria-label="Ir a Exámenes" 
                    style={{ 
                      ...cardBaseStyle, 
                      ...(hoveredCard === "exam" ? cardHoverStyle : {}) 
                    }} 
                    bodyStyle={cardBodyStyle}
                  >
                    <div style={textBlockStyle}>
                      <Title level={5} style={{ 
                        margin: 22,
                        marginTop: 32, 
                        lineHeight: 1.5, 
                        fontSize: 38, 
                        color: "#1A2A80",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}>
                        Exámenes
                      </Title>
                      <Text style={{ 
                        marginTop: 6, 
                        color: "#1A2A80",
                        fontSize: 16,
                        fontWeight: 500
                      }}>
                        {studentData.aws.exam}
                      </Text>
                    </div>
                  </Card>
                </Link>
              </div>

              <div style={cardWrapperStyle}>
                <Link 
                  to="/entrevistas" 
                  style={{ textDecoration: "none", width: "100%" }}
                  onMouseEnter={() => handleCardHover("interview")}
                  onMouseLeave={handleCardLeave}
                >
                  <Card 
                    hoverable 
                    role="button" 
                    aria-label="Ir a Entrevistas" 
                    style={{ 
                      ...cardBaseStyle, 
                      ...(hoveredCard === "interview" ? cardHoverStyle : {}) 
                    }} 
                    bodyStyle={cardBodyStyle}
                  >
                    <div style={{ ...textBlockStyle }}>
                      <Title level={5} style={{ 
                        margin: 22,
                        marginTop: 32, 
                        lineHeight: 1.5, 
                        fontSize: 38, 
                        color: "#1A2A80",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}>
                        Entrevistas
                      </Title>
                      <Text style={{ 
                        marginTop: 6, 
                        color: "#1A2A80",
                        fontSize: 16,
                        fontWeight: 500
                      }}>
                        {studentData.aws.interview}
                      </Text>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>

            <Divider style={{ marginTop: 48 }} />
            <div
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 8,
                marginTop: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: "1px solid #f0f0f0"
              }}
            >
              <Title level={4} style={{ color: "#3B38A0" }}>
                Comparte tu progreso
              </Title>
              <Text type="secondary">
                Próximamente podrás compartir tus avances con tus profesores
              </Text>
            </div>
          </div>

          <FloatButton
            icon={<MessageOutlined />}
            type="primary"
            style={{ 
              backgroundColor: "#3B38A0",
              right: 24,
              bottom: 24,
              width: 56,
              height: 56,
            }}
            tooltip="Abrir chat de ayuda"
          />
        </Content>
      </Layout>
    </Layout>
  );
}