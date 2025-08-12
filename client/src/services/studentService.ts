import jsonInstance from "../api/jsonIntance";
import type { StudentGroup } from "../interfaces/studentInterface";

export const studentService = {
  async getStudentGroups(): Promise<StudentGroup[]> {
    try {
      const response = await jsonInstance.get("/students");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch student groups", error);
      throw error;
    }
  },

  async getStudentGroupById(claseId: string): Promise<StudentGroup | null> {
  try {
    const response = await jsonInstance.get("/students");
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
      const response = await jsonInstance.post("/students", group);
      return response.data;
    } catch (error) {
      console.error("Failed to create student group", error);
      throw error;
    }
  },

  async updateStudentGroup(id: string, groupData: Partial<StudentGroup>): Promise<StudentGroup> {
    try {
      const response = await jsonInstance.patch(`/students/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error("Failed to update student group", error);
      throw error;
    }
  },

  async deleteStudentGroup(id: string): Promise<void> {
    try {
      await jsonInstance.delete(`/students/${id}`);
    } catch (error) {
      console.error("Failed to delete student group", error);
      throw error;
    }
  },
};
