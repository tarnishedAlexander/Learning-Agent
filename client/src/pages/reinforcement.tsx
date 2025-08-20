import React, { useState, useEffect, useRef } from "react";
import { Card, Divider, Typography, Avatar, Layout, FloatButton, Modal, Input, Button } from "antd";
import { UserOutlined, MessageOutlined, SendOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./Reinforcement.css";

const COLORS = {
  deepNavy: "#1A2A80",
  royalPurple: "#3B38A0",
  softPeriwinkle: "#7A85C1",
  paleLavender: "#B2B0E8",
  pureWhite: "#FFFFFF",
  darkCharcoal: "#222222"
};

const layoutStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: COLORS.pureWhite,
  display: "flex"
};

const siderStyle: React.CSSProperties = {
  background: COLORS.deepNavy,
  padding: "24px 16px",
  boxShadow: "4px 0 12px rgba(0, 0, 0, 0.08)",
  position: "sticky",
  top: 0,
  height: "100vh",
  overflowY: "auto"
};

export function StudentProfile() {
  const [activeSubject, setActiveSubject] = useState("Matemáticas");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const studentData = {
    name: "Juan Pérez",
    role: "Estudiante",
    subjects: ["Matemáticas", "Física", "Programación", "Historia"],
    courses: [
      {
        id: "exam",
        title: (subject: string) => `Exámenes de ${subject}`,
        description: "Demuestra tus conocimientos en esta materia"
      },
      {
        id: "interview",
        title: "Entrevistas Técnicas",
        description: "Prepárate para tu próximo desafío profesional"
      }
    ]
  };

  const handleChatClick = () => {
    setIsChatOpen(true);
    setMessages([]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([{
        sender: "bot",
        text: "¡Hola! Soy tu asistente de AWS. ¿En qué puedo ayudarte hoy?"
      }]);
    }, 1800);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = { sender: "user", text: inputValue.trim() };
      setMessages([...messages, newMessage]);
      setInputValue("");
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: "Gracias por tu mensaje. Estoy aquí para ayudarte con AWS y tus cursos."
          }
        ]);
      }, 2000);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <Layout style={layoutStyle}>
      <Layout.Sider width={280} style={siderStyle}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Avatar
            size={86}
            icon={<UserOutlined />}
            style={{
              background: `linear-gradient(135deg, ${COLORS.softPeriwinkle} 0%, ${COLORS.paleLavender} 100%)`,
              color: COLORS.deepNavy,
              marginBottom: "20px",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
              transition: "transform 0.3s ease"
            }}
            className="avatar-hover"
          />
          <Typography.Title
            level={3}
            style={{
              color: COLORS.pureWhite,
              margin: 0,
              fontWeight: 600,
              fontSize: "22px"
            }}
          >
            {studentData.name}
          </Typography.Title>
          <Typography.Text
            style={{
              color: COLORS.paleLavender,
              display: "block",
              fontSize: "14px",
              marginTop: "4px"
            }}
          >
            {studentData.role}
          </Typography.Text>
        </div>
        <Divider style={{
          borderColor: "rgba(255, 255, 255, 0.15)",
          margin: "24px 0"
        }} />
        <Typography.Title
          level={4}
          style={{
            color: COLORS.pureWhite,
            marginBottom: "18px",
            fontWeight: 500,
            fontSize: "16px"
          }}
        >
          Mis Materias
        </Typography.Title>
        <div style={{ padding: "0 8px" }}>
          {studentData.subjects.map((subject) => (
            <div
              key={subject}
              style={{
                background: activeSubject === subject ? COLORS.royalPurple : "transparent",
                color: activeSubject === subject ? COLORS.pureWhite : COLORS.paleLavender,
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "10px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: activeSubject === subject ? "translateX(6px)" : "none",
                boxShadow: activeSubject === subject ? "0 4px 10px rgba(0, 0, 0, 0.12)" : "none"
              }}
              onClick={() => setActiveSubject(subject)}
              className="subject-hover"
            >
              {subject}
            </div>
          ))}
        </div>
      </Layout.Sider>
      <Layout.Content style={{
        flex: 1,
        padding: "40px",
        overflowY: "auto"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Typography.Title
            level={1}
            style={{
              color: COLORS.deepNavy,
              marginBottom: "40px",
              fontWeight: 700,
              fontSize: "30px"
            }}
          >
            {activeSubject}
          </Typography.Title>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "28px",
          }}>
            {studentData.courses.map((course) => (
              <Link to={`/${course.id}`} key={course.id} style={{ textDecoration: "none" }}>
                <div className="card-hover">
                  <Card
                    hoverable
                    style={{
                      background: COLORS.pureWhite,
                      borderRadius: "16px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                      border: "none",
                      overflow: "hidden",
                      transition: "all 0.4s ease"
                    }}
                    bodyStyle={{
                      padding: "28px",
                      background: "#F9FAFF"
                    }}
                  >
                    <div style={{
                      height: "100px",
                      background: `linear-gradient(135deg, ${COLORS.royalPurple} 0%, ${COLORS.deepNavy} 100%)`,
                      borderRadius: "12px",
                      margin: "-28px -28px 20px -28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 100%)",
                        transition: "opacity 0.3s ease"
                      }} className="card-glow" />
                      <Typography.Title
                        level={3}
                        style={{
                          color: COLORS.pureWhite,
                          margin: 0,
                          fontWeight: 600,
                          fontSize: "18px",
                          position: "relative",
                          zIndex: 1
                        }}
                      >
                        {typeof course.title === 'function'
                          ? course.title(activeSubject)
                          : course.title}
                      </Typography.Title>
                    </div>
                    <Typography.Text
                      style={{
                        color: COLORS.darkCharcoal,
                        fontSize: "15px",
                        lineHeight: 1.6
                      }}
                    >
                      {course.description}
                    </Typography.Text>
                    <div
                      style={{
                        height: "3px",
                        background: `linear-gradient(90deg, ${COLORS.paleLavender} 0%, ${COLORS.softPeriwinkle} 100%)`,
                        borderRadius: "2px",
                        marginTop: "20px",
                        transition: "all 0.3s ease"
                      }}
                      className="card-line"
                    />
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </div>

        
        <div className="float-button-animation" style={{ position: "fixed", right: "40px", bottom: "5px", zIndex: 100 }}>
          <FloatButton
            icon={<MessageOutlined style={{ fontSize: "20px" }} />}
            type="primary"
            onClick={handleChatClick}
            style={{
              background: COLORS.royalPurple,
              width: "56px",
              height: "56px",
              boxShadow: "0 6px 16px rgba(58, 56, 160, 0.4)"
            }}
          />
        </div>
      </Layout.Content>
      <Modal
        title={null}
        open={isChatOpen}
        onCancel={() => setIsChatOpen(false)}
        footer={null}
        width="90vw" 
        style={{ 
          top: "auto", 
          bottom: 0,
          left: "auto",
          right: 0,
          margin: 15,
          position: "fixed",
          maxWidth: "65%",
          padding: 12 
        }}
        closable={false}
        bodyStyle={{ padding: 0, background: "transparent", boxShadow: "none" }}
        className="chat-modal"
      >
        <div style={{
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          background: COLORS.pureWhite,
          borderRadius: "20px",
          overflow: "hidden",
          animation: "scaleIn 0.3s ease-out"
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.deepNavy} 0%, ${COLORS.royalPurple} 100%)`,
            padding: "24px",
            textAlign: "center"
          }}>
            <Typography.Title
              level={4}
              style={{
                color: COLORS.pureWhite,
                margin: 0,
                fontWeight: 600,
                fontSize: "20px"
              }}
            >
              Asistente
            </Typography.Title>
            <Typography.Text
              style={{
                color: COLORS.paleLavender,
                display: "block",
                marginTop: "6px",
                fontSize: "14px"
              }}
            >
              Estoy aquí para ayudarte con tus cursos
            </Typography.Text>
          </div>
          <div
            ref={chatBodyRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  background: message.sender === 'user' ? COLORS.royalPurple : "#F0F2FF",
                  color: message.sender === 'user' ? COLORS.pureWhite : COLORS.darkCharcoal,
                  padding: "14px 20px",
                  borderRadius: message.sender === 'user' ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  marginLeft: message.sender === 'user' ? "auto" : "0",
                  marginRight: message.sender === 'user' ? "0" : "auto",
                  maxWidth: "80%",
                  boxShadow: message.sender === 'user'
                    ? "0 4px 12px rgba(58, 56, 160, 0.15)"
                    : "0 4px 12px rgba(0, 0, 0, 0.05)",
                  animation: "fadeInUp 0.3s ease-out",
                  animationDelay: `${index * 0.05}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                  wordBreak: "break-word"
                }}
              >
                {message.text}
              </div>
            ))}
            {isTyping && (
              <div
                style={{
                  background: "#F0F2FF",
                  color: COLORS.darkCharcoal,
                  padding: "14px 20px",
                  borderRadius: "20px 20px 20px 4px",
                  marginRight: "auto",
                  marginBottom: "16px",
                  maxWidth: "120px",
                  display: 'flex',
                  alignItems: 'center',
                  animation: "fadeIn 0.3s forwards"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  color: COLORS.deepNavy
                }}>
                  Escribiendo
                  <span className="typing-dot" style={{ animationDelay: "0s" }}></span>
                  <span className="typing-dot" style={{ animationDelay: "0.2s" }}></span>
                  <span className="typing-dot" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
          </div>
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{
              display: "flex",
              gap: "12px",
              alignItems: "center"
            }}>
              <Input
                placeholder="Escribe tu mensaje..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSendMessage}
                style={{
                  flex: 1,
                  borderRadius: "50px",
                  padding: "12px 20px",
                  background: "#F5F7FF",
                  border: "none",
                  transition: "box-shadow 0.3s ease"
                }}
                className="input-hover"
              />
              <div className="button-hover">
                <Button
                  type="primary"
                  onClick={handleSendMessage}
                  icon={<SendOutlined />}
                  style={{
                    background: COLORS.royalPurple,
                    border: "none",
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.3s ease"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}