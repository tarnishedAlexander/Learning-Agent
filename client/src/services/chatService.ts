import type { ChatWithIARequest, ChatWithIAResponse } from "../interfaces/model";

export const getChatResponse = async (question: string): Promise<ChatWithIAResponse> => {
  const response = await fetch(`${import.meta.env.VITE_URL}${import.meta.env.CHAT_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question } as ChatWithIARequest),
  });

  if (!response.ok) {
    throw new Error("Error fetching chat response");
  }

  return response.json();
};