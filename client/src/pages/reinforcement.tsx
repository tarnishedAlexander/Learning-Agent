import React, { useState, useEffect, useRef } from "react";
import { Card, Divider, Typography, Avatar, Layout, FloatButton, Modal, Input, Button } from "antd";
import { UserOutlined, MessageOutlined, SendOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./reinforcement.css";

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
    <Layout className="layout">
      <Layout.Sider width={280} className="sider">
        <div className="sider-header">
          <Avatar
            size={86}
            icon={<UserOutlined />}
            className="avatar avatar-hover"
          />
          <Typography.Title level={3} className="sider-title">
            {studentData.name}
          </Typography.Title>
          <Typography.Text className="sider-role">
            {studentData.role}
          </Typography.Text>
        </div>
        <Divider className="sider-divider" />
        <Typography.Title level={4} className="sider-subjects-title">
          Mis Materias
        </Typography.Title>
        <div className="subjects-list">
          {studentData.subjects.map((subject) => (
            <div
              key={subject}
              className={`subject-item ${activeSubject === subject ? "active" : ""} subject-hover`}
              onClick={() => setActiveSubject(subject)}
            >
              {subject}
            </div>
          ))}
        </div>
      </Layout.Sider>
      <Layout.Content className="content">
        <div className="content-container">
          <Typography.Title level={1} className="content-title">
            {activeSubject}
          </Typography.Title>
          <div className="courses-grid">
            {studentData.courses.map((course) => (
              <Link to={`/${course.id}`} key={course.id} className="card-link">
                <div className="card-hover">
                  <Card
                    hoverable
                    className="course-card"
                    bodyStyle={{ padding: "28px", background: "#F9FAFF" }}
                  >
                    <div className="card-header">
                      <div className="card-glow" />
                      <Typography.Title level={3} className="card-title">
                        {typeof course.title === 'function'
                          ? course.title(activeSubject)
                          : course.title}
                      </Typography.Title>
                    </div>
                    <Typography.Text className="card-description">
                      {course.description}
                    </Typography.Text>
                    <div className="card-line" />
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="float-button-animation">
          <FloatButton
            icon={<MessageOutlined style={{ fontSize: "20px" }} />}
            type="primary"
            onClick={handleChatClick}
            className="float-button"
          />
        </div>
      </Layout.Content>

      {/* --- MODAL DE CHAT (MÁS ANCHO Y RESPONSIVO) --- */}
            <Modal
        title={null}
        open={isChatOpen}
        onCancel={() => setIsChatOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: "40px", maxWidth: "500px" }}
        closable={false}
        bodyStyle={{ padding: 0, borderRadius: "20px", background: "transparent" }}
        className="aws-chat-modal"
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
            padding: "24px 0",
            textAlign: "center",
            width: "calc(100% + 48px)",
            marginLeft: "-24px",
            marginRight: "-24px",
            boxSizing: "border-box",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px"
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
            <Typography.Text className="chat-subtitle">
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
              <div className="typing-indicator">
                <div className="typing-text">
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
            background: COLORS.pureWhite,
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
                className="chat-input input-hover"
              />
              <div className="button-hover">
                <Button
                  type="primary"
                  onClick={handleSendMessage}
                  icon={<SendOutlined />}
                  className="send-button"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

      <style>
        {`
          .subject-hover:hover {
            background: #3B38A033 !important;
            transform: translateX(4px) !important;
          }
          
          .card-hover:hover {
            transform: translateY(-8px);
            box-shadow: 0 16px 32px rgba(58, 56, 160, 0.2) !important;
          }
          .card-hover {
            transition: all 0.4s ease;
          }
          .card-hover:hover .card-glow {
            opacity: 0.8;
          }
          .card-hover:hover .card-line {
            height: 5px;
            background: linear-gradient(90deg, ${COLORS.softPeriwinkle} 0%, ${COLORS.royalPurple} 100%);
          }
          
          .float-button-animation {
            animation: float 3s ease-in-out infinite;
          }
          
          .avatar-hover:hover {
            transform: scale(1.05);
          }
          
          .input-hover:hover {
            box-shadow: 0 0 0 2px ${COLORS.paleLavender};
          }
          
          .button-hover:hover button {
            transform: scale(1.1);
          }
          
          .typing-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: ${COLORS.deepNavy};
            border-radius: 50%;
            margin: 0 2px;
            opacity: 0.6;
            animation: pulse 1.5s infinite;
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          
          @keyframes pulse {
            0% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0.2; transform: scale(0.8); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes fadeInUp {
            from { 
              opacity: 0;
              transform: translateY(10px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            from { 
              opacity: 0;
              transform: scale(0.95);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }

          .ant-modal-content {
            padding: 0 !important;
            background: transparent !important;
            border-radius: 20px;
            overflow: visible;
            box-shadow: none;
          }

          .aws-chat-modal .ant-modal-body {
            padding: 0 !important;
            background: transparent !important;
          }

          .input-hover::placeholder {
            color: #5a5a5a;
            opacity: 1;
          }
          
          @media (max-width: 768px) {
            .ant-modal {
              max-width: 90vw !important;
              margin: 0 auto;
            }
            .ant-modal-content {
              padding: 0 !important;
            }
            .ant-modal-body {
              padding: 0 !important;
            }
          }
        `}
      </style>
     </Layout> 
  ); 
}
