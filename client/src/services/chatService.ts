import type { ChatWithIARequest, ChatWithIAResponse } from "../interfaces/model";

export const getChatResponse = async (question: string): Promise<ChatWithIAResponse> => {
  const response = await fetch("http://localhost:3000/chat", {
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