
import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Typography, Button, Modal, Space } from 'antd';
import { RightOutlined, SendOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const ChatMessage = ({ text, isUser }) => {
  const messageStyle = {
    padding: '12px 18px',
    borderRadius: '22px',
    maxWidth: '75%',
    wordWrap: 'break-word',
    fontSize: '15px',
    backgroundColor: isUser ? '#f0f2f5' : '#e6e6e6',
    color: '#333',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      }}
    >
      <div style={messageStyle}>
        {text}
      </div>
    </div>
  );
};

export default function InterviewChat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'insertar pregunta' }
  ]);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isInputDisabled) return;

    const userMessage = { sender: 'user', text: inputValue.trim() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsInputDisabled(true);

    if (!feedbackGiven) {
      setTimeout(() => {
        const botResponse = { sender: 'bot', text: 'Gracias por tu respuesta. Esa es una buena perspectiva.' };
        setMessages(prevMessages => [...prevMessages, botResponse]);
        setFeedbackGiven(true);
      }, 500);
    }
  };

  const handleNextQuestionClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '100%',
          maxHeight: '800px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{ flex: 1, overflowY: 'auto', padding: '24px' }}
      >
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              text={msg.text}
              isUser={msg.sender === 'user'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </Card>
      
      {/* Input de chat fijo en la parte inferior */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          width: '100%',
          maxWidth: '800px',
          padding: '0 20px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '760px' }}>
          <Input
            placeholder="Escribe tu respuesta..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendMessage}
            disabled={isInputDisabled}
            size="large"
            style={{ borderRadius: '25px', paddingRight: '0px' }}
            suffix={
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isInputDisabled}
                style={{ color: '#1890ff' }}
              />
            }
          />
        </div>
      </div>
      
      {/* Botón de "Siguiente Pregunta" fijo en la esquina */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
        }}
      >
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={handleNextQuestionClick}
          style={{ 
            color: '#000', 
            background: '#fff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        />
      </div>

      <Modal
        title="Funcionalidad en desarrollo"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </Button>,
        ]}
      >
        <p>Esta funcionalidad aún está en desarrollo y estará disponible pronto.</p>
      </Modal>
    </div>
  );
}

