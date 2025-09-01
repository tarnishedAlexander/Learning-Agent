import apiClient from "../api/apiClient";
import type { ChatWithIARequest, ChatWithIAResponse } from "../interfaces/model";

export const getChatResponse = async (question: string): Promise<ChatWithIAResponse> => {
  try {
    const response = await apiClient.post<ChatWithIAResponse>("/chat", { 
      question 
    } as ChatWithIARequest);
    
    return response.data;
  } catch (error) {
    console.error("Failed to get chat response", error);
    throw new Error("Error fetching chat response");
  }
};