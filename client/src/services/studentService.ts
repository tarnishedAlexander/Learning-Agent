import apiClient from "../api/apiClient";
import type { StudentInfo, StudentGroup } from "../interfaces/studentInterface";

export const studentService = {

  async getStudentsByClassId(classId: string): Promise<StudentInfo[]> {
    try {
      const response = await apiClient.get(`/academic/students/by-class/${classId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch students by classId", error);
      throw error;
    }
  },

  async getStudentGroups(): Promise<StudentGroup[]> {
    try {
      const response = await apiClient.get("/students");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch student groups", error);
      throw error;
    }
  },

  async getStudentGroupById(claseId: string): Promise<StudentGroup | null> {
  try {
    const response = await apiClient.get("/students");
    const groups: StudentGroup[] = response.data;
    const match = groups.find((group) => group.claseId === claseId);
    return match ?? null;
  } catch (error) {
    console.error("Failed to fetch student group by claseId", error);
    throw error;
  }
},

  async createStudentGroup(group: Omit<StudentGroup, "id">): Promise<StudentGroup> {
    try {
      const response = await apiClient.post("/students", group);
      return response.data;
    } catch (error) {
      console.error("Failed to create student group", error);
      throw error;
    }
  },

  async updateStudentGroup(id: string, groupData: Partial<StudentGroup>): Promise<StudentGroup> {
    try {
      const response = await apiClient.patch(`/students/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error("Failed to update student group", error);
      throw error;
    }
  },

  async deleteStudentGroup(id: string): Promise<void> {
    try {
      await apiClient.delete(`/students/${id}`);
    } catch (error) {
      console.error("Failed to delete student group", error);
      throw error;
    }
  },
};
