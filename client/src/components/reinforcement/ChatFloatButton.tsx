import React from "react";
import { FloatButton } from "antd";
import { MessageOutlined } from "@ant-design/icons";

interface ChatFloatButtonProps {
  onClick: () => void;
}

export const ChatFloatButton: React.FC<ChatFloatButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed right-10 bottom-1 z-50 animate-float">
      <FloatButton
        icon={<MessageOutlined />}
        type="default"
        onClick={onClick}
        className="!w-14 !h-14 bg-[#3A38A0] shadow-xl transition-all duration-200 ease-in-out hover:bg-[#3B38A0]"
      />
    </div>
  );
};