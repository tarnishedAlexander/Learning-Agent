import { useState, useRef, useEffect } from "react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface ChatWithIARequest {
  question: string;
}

interface ChatWithIAResponse {
  answer: string;
}

const MIN_CHARACTERS = 1;

export const useChatLogic = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            text: "¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?",
            sender: "bot",
          },
        ]);
        setIsTyping(false);
        scrollToBottom();
      }, 3000); 
    }
    scrollToBottom();
  }, [isChatOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChatClick = () => {
    setIsChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim().length >= MIN_CHARACTERS) {
      const userMessage: Message = { text: inputValue.trim(), sender: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_URL}${import.meta.env.VITE_CHAT_URL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: userMessage.text } as ChatWithIARequest),
        });
        const data = await response.json() as ChatWithIAResponse;
        setMessages((prev) => [...prev, { text: data.answer, sender: "bot" }]);
      } catch (error) {
        console.error("Error al obtener respuesta de la IA:", error);
        setMessages((prev) => [
          ...prev,
          { text: "Lo siento, hubo un error al obtener la respuesta.", sender: "bot" },
        ]);
      } finally {
        setIsTyping(false);
        scrollToBottom();
      }
    } else {
      console.warn(`El mensaje debe tener al menos ${MIN_CHARACTERS} caracteres.`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return {
    isChatOpen,
    handleChatClick,
    setIsChatOpen,
    isTyping,
    messages,
    inputValue,
    messagesEndRef,
    handleSendMessage,
    setInputValue,
    handleKeyPress,
  };
};