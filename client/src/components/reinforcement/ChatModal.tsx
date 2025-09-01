import React from "react";
import { Modal, Input, Button, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useChatLogic } from "../../hooks/useChatLogic";
import "./chat.css";

interface ChatModalProps {
  isChatOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isChatOpen, onClose }) => {
  const {
    isTyping,
    messages,
    inputValue,
    messagesEndRef,
    handleSendMessage,
    setInputValue,
    handleKeyPress,
  } = useChatLogic();

  return (
    <Modal
      title={null}
      open={isChatOpen}
      onCancel={onClose}
      footer={null}
      width={400}
      style={{ bottom: "20px", right: "20px", position: "fixed" }}
      closable={false}
      styles={{ body: { padding: 0 } }} // <--- Updated line
      className="simple-chat-modal"
    >
      <div className="simple-chat-container">
        <div className="simple-chat-header">
          <Typography.Title level={4} className="simple-chat-title">
            Asistente Virtual
          </Typography.Title>
          <Button
            type="text"
            onClick={onClose}
            style={{ position: "absolute", right: "10px", top: "10px", color: "white" }}
          >
            X
          </Button>
        </div>
        <div className="simple-chat-body">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`simple-chat-message ${message.sender === "user" ? "user" : "bot"}`}
            >
              {message.text}
            </div>
          ))}
          {isTyping && (
            <div className="simple-typing-indicator">
              <span className="simple-typing-dot"></span>
              <span className="simple-typing-dot"></span>
              <span className="simple-typing-dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="simple-chat-footer">
          <Input
            placeholder="Escribe tu mensaje..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleKeyPress}
            className="simple-chat-input"
            suffix={
              <Button
                type="text"
                onClick={handleSendMessage}
                icon={<SendOutlined />}
                disabled={inputValue.trim().length < 1 || isTyping}
              />
            }
          />
        </div>
      </div>
    </Modal>
  );
};