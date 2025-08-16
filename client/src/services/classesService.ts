import { apiClient } from "../api/apiClient";
import type { Clase } from "../interfaces/claseInterface";

export const claseService = {
  async getClases(): Promise<Clase[]> {
    try {
      const response = await apiClient.get("/gestion_academica/classes/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clases", error);
      throw error;
    }
  },
  
  //TODO - Falta implementar el endpoint de clase por id
  async getClaseById(id: string): Promise<Clase> {
    try {
      const response = await apiClient.get(`/gestion_academica/classes/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clase", error);
      throw error;
    }
  },

  async createClase(clase: Omit<Clase, "id">): Promise<Clase> {
    try {
      const response = await apiClient.post("/gestion_academica/classes", clase);
      return response.data;
    } catch (error) {
      console.error("Failed to create clase", error);
      throw error;
    }
  },

  //TODO - Falta implementar el endpoint de actualizar clase
  async updateClase(id: string, claseData: Partial<Clase>): Promise<Clase> {
    try {
      const response = await apiClient.put(`/gestion_academica/classes/${id}`, claseData);
      return response.data;
    } catch (error) {
      console.error("Failed to update clase", error);
      throw error;
    }
  },

  //TODO - Falta implementar el endpoint de eliminar clase
  async deleteClase(id: string): Promise<void> {
    try {
      await apiClient.delete(`/gestion_academica/classes/${id}`);
    } catch (error) {
      console.error("Failed to delete clase", error);
      throw error;
    }
  },
};