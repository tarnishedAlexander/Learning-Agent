import jsonInstance from "../api/jsonIntance";
import type { fileInterface } from "../interfaces/fileInterface";

export const fileService = {
  async uploadFile(file: File): Promise<fileInterface> {
    // Simulación: solo envía nombre fecha, y tamaño
    const data = {
      Name: file.name,
      start_upload: new Date().toISOString().split("T")[0],
      size: file.size
    };
    try {
      const response = await jsonInstance.post("/files", data);
      return response.data;
    } catch (error) {
      console.error("Failed to upload file", error);
      throw error;
    }
  },
};