import docsInstance from "../api/docsInstance";
import type { Document } from "../interfaces/documentInterface";

export const documentService = {
  async getDocuments(): Promise<Document[]> {
    try {
      const response = await docsInstance.get("/documents");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch documents", error);
      throw error;
    }
  },

  async uploadDocument(file: File): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Simular la subida al S3 usando json-server
      const document: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        uploadDate: new Date().toISOString(),
        size: file.size,
        url: URL.createObjectURL(file) // En producción, aquí iría la URL del S3
      };

      const response = await docsInstance.post("/documents", document);
      return response.data;
    } catch (error) {
      console.error("Failed to upload document", error);
      throw error;
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await docsInstance.delete(`/documents/${id}`);
    } catch (error) {
      console.error("Failed to delete document", error);
      throw error;
    }
  }
};
