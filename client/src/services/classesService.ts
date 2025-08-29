import apiClient from "../api/apiClient";
import type { Clase } from "../interfaces/claseInterface";

export const claseService = {
  async getClases(): Promise<Clase[]> {
    try {
      const response = await apiClient.get("/academic/classes/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clases", error);
      throw error;
    }
  },
  
  async getClaseById(id: string): Promise<Clase> {
    try {
      const response = await apiClient.get(`/academic/classes/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clase", error);
      throw error;
    }
  },

  async createClase(clase: Omit<Clase, 'id' | 'isActive' | 'name'>): Promise<Clase> {
    try {
          console.log("Valores que se envían al backend 2:", clase);
      const response = await apiClient.post("/academic/classes", clase);
      return response.data;
    } catch (error) {
      console.error("Failed to create clase", error);
      throw error;
    }
  },

  async updateClase(id: string, claseData: Partial<Clase>): Promise<Clase> {
    try {
      const response = await apiClient.put(`/academic/classes/${id}`, claseData);
      return response.data;
    } catch (error) {
      console.error("Failed to update clase", error);
      throw error;
    }
  },

  async softDeleteClase(id: string, teacherId: string) {
    try {
      const response = await apiClient.put(`/academic/classes/remove/${id}`, {teacherId});
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error("Failed to soft-delete clase", error);
      return {
        success: false
      }
    }
  },

  async getCourseById(id: string): Promise<Clase> {
    try {
      const response = await apiClient.get(`/academic/classes/by-course/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch course", error);
      throw error;
    }
  },
};