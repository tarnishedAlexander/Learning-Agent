import { apiClient } from "../api/apiClient";
import type { Clase } from "../interfaces/claseInterface";

export const claseService = {
  async getClases(): Promise<Clase[]> {
    try {
      const response = await apiClient.get("/clases");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clases", error);
      throw error;
    }
  },

  async getClaseById(id: string): Promise<Clase> {
    try {
      const response = await apiClient.get(`/clases/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clase", error);
      throw error;
    }
  },

  async createClase(clase: Omit<Clase, "id">): Promise<Clase> {
    try {
      const response = await apiClient.post("/clases", clase);
      return response.data;
    } catch (error) {
      console.error("Failed to create clase", error);
      throw error;
    }
  },

  async updateClase(id: string, claseData: Partial<Clase>): Promise<Clase> {
    try {
      const response = await apiClient.patch(`/clases/${id}`, claseData);
      return response.data;
    } catch (error) {
      console.error("Failed to update clase", error);
      throw error;
    }
  },

  async deleteClase(id: string): Promise<void> {
    try {
      await apiClient.delete(`/clases/${id}`);
    } catch (error) {
      console.error("Failed to delete clase", error);
      throw error;
    }
  },
};