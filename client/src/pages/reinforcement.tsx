import React, { useState, useEffect, useRef } from "react";
import { Card, Divider, Typography, Avatar, Layout, FloatButton, Modal, Input, Button } from "antd";
import { UserOutlined, MessageOutlined, SendOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getResponse } from "../api/api";
import "./reinforcement.css";


const MIN_CHARACTERS = 3;

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
        text: "¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?"
      }]);
    }, 1800);
  };

  const handleSendMessage = async () => {
    // Comprueba si el input tiene al menos el número mínimo de caracteres
    if (inputValue.trim().length >= MIN_CHARACTERS) {
      const newMessage = { sender: "user", text: inputValue.trim() };
      setMessages(prev => [...prev, newMessage]);
      setInputValue("");
      setIsTyping(true);

      try {
        const botResponse = await getResponse(newMessage.text);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: botResponse }
        ]);
      } catch (error) {
        console.error("Error al obtener respuesta de la IA:", error);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "Lo siento, hubo un error al obtener la respuesta." }
        ]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Opcional: mostrar un mensaje de error al usuario
      console.warn(`El mensaje debe tener al menos ${MIN_CHARACTERS} caracteres.`);
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
      <Modal
        title={null}
        open={isChatOpen}
        onCancel={() => setIsChatOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: "auto", bottom: "40px", maxWidth: "600px" }}
        closable={false}
        bodyStyle={{ padding: 0, borderRadius: "20px" }}
        className="chat-modal"
      >
        <div className="chat-container">
          <div className="chat-header">
            <Typography.Title level={4} className="chat-title">
              Asistente
            </Typography.Title>
            <Typography.Text className="chat-subtitle">
              Estoy aquí para ayudarte con tus cursos
            </Typography.Text>
          </div>
          <div ref={chatBodyRef} className="chat-body">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${message.sender === 'user' ? 'user' : 'bot'}`}
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
          <div className="chat-footer">
            <div className="input-container">
              <Input
                placeholder={`Escribe tu mensaje (mín. ${MIN_CHARACTERS} caracteres)...`}
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