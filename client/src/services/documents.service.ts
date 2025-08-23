// src/services/documents.service.ts
import { api } from "./api/instance";
import type { Document, DocumentListResponse, UploadResponse } from "../interfaces/documentInterface";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:3000") as string;
const USE_MOCK = (import.meta.env.VITE_USE_MOCK === "true");

export const documentService = {
  async getDocuments(): Promise<DocumentListResponse> {
    try {
      if (!USE_MOCK) {
        // backend real: asumimos que devuelve DocumentListResponse
        const resp = await api.get("/documents");
        return resp.data as DocumentListResponse;
      }

      // mock: json-server devuelve un array plano
      const res = await fetch(`${API_BASE}/documents`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const raw = (await res.json()) as any[]; // cada elemento puede tener dataUrl, createdAt, id, etc.

      // mapear al shape Document
      const documents: Document[] = raw.map((d) => ({
        fileName: d.fileName,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        // para modo mock usamos la dataUrl (base64) como downloadUrl
        downloadUrl: d.dataUrl ?? d.downloadUrl ?? `${API_BASE}/files/${d.fileName}`,
        uploadedAt: d.uploadedAt ?? d.createdAt ?? new Date().toISOString(),
      }));

      return {
        success: true,
        data: {
          documents,
          totalCount: documents.length,
        },
      };
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      throw error;
    }
  },

  _fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Error leyendo el archivo"));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  },

  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      if (!USE_MOCK) {
        const form = new FormData();
        form.append("file", file);
        const resp = await fetch(`${API_BASE}/documents/upload`, {
          method: "POST",
          body: form,
        });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const data = await resp.json();
        return data as UploadResponse;
      }

      // MOCK: convertir a dataUrl y guardar metadata en json-server
      const dataUrl = await this._fileToDataUrl(file);
      const payload = {
        fileName: `${Date.now()}_${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl, // guardamos el base64
        createdAt: new Date().toISOString(),
      };

      const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const saved = await res.json();

      // mapear saved a UploadResponse (data = Document)
      const doc: Document = {
        fileName: saved.fileName,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        size: saved.size,
        downloadUrl: saved.dataUrl ?? `${API_BASE}/files/${saved.fileName}`,
        uploadedAt: saved.createdAt ?? new Date().toISOString(),
      };

      return {
        success: true,
        data: doc,
      };
    } catch (error) {
      console.error("Error al subir documento:", error);
      throw error;
    }
  },

  async downloadDocument(fileName: string): Promise<Blob> {
    try {
      if (!USE_MOCK) {
        const resp = await fetch(`${API_BASE}/documents/download/${encodeURIComponent(fileName)}`);
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        return await resp.blob();
      }

      // mock: buscar por fileName
      const q = await fetch(`${API_BASE}/documents?fileName=${encodeURIComponent(fileName)}`);
      if (!q.ok) throw new Error(`HTTP error! status: ${q.status}`);
      const items = (await q.json()) as any[];
      const doc = items[0];
      if (!doc) throw new Error("Documento no encontrado en mock server");

      // dataUrl -> blob
      const blobResp = await fetch(doc.dataUrl);
      if (!blobResp.ok) throw new Error("No se pudo convertir dataUrl a blob");
      return await blobResp.blob();
    } catch (error) {
      console.error("Error al descargar documento:", error);
      throw error;
    }
  },

  async getDocumentByFileName(fileName: string): Promise<Document> {
    try {
      if (!USE_MOCK) {
        const resp = await api.get(`/documents/${fileName}`);
        return resp.data as Document;
      }
      const res = await fetch(`${API_BASE}/documents?fileName=${encodeURIComponent(fileName)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const items = (await res.json()) as any[];
      const d = items[0];
      if (!d) throw new Error("Documento no encontrado");
      return {
        fileName: d.fileName,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        downloadUrl: d.dataUrl ?? d.downloadUrl,
        uploadedAt: d.uploadedAt ?? d.createdAt,
      };
    } catch (error) {
      console.error("Error al obtener documento por nombre:", error);
      throw error;
    }
  },

  async deleteDocument(fileName: string): Promise<void> {
    try {
      if (!USE_MOCK) {
        const resp = await fetch(`${API_BASE}/documents/${encodeURIComponent(fileName)}`, { method: "DELETE" });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        return;
      }

      const q = await fetch(`${API_BASE}/documents?fileName=${encodeURIComponent(fileName)}`);
      if (!q.ok) throw new Error(`HTTP error! status: ${q.status}`);
      const items = (await q.json()) as any[];
      const doc = items[0];
      if (!doc) throw new Error("Documento no encontrado en mock server");

      const del = await fetch(`${API_BASE}/documents/${doc.id}`, { method: "DELETE" });
      if (!del.ok) throw new Error(`HTTP error! status: ${del.status}`);
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      throw error;
    }
  },

  async downloadAndSaveDocument(fileName: string, originalName?: string): Promise<void> {
    try {
      const blob = await this.downloadDocument(fileName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName ?? fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar y guardar documento:", error);
      throw error;
    }
  },
};
