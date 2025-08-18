import axios from "axios";
const jsonInstance = axios.create({ baseURL: import.meta.env.VITE_API_BASE || "" });


export async function downloadFileByKey(key: string) {
  const url = `/files/${encodeURIComponent(key)}`;

  const response = await jsonInstance.get(url, {
    responseType: "blob",
    validateStatus: (s) => s >= 200 && s < 500, 
  });

  if (response.status === 404) {
    throw new Error("El archivo no existe");
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error("Error al descargar");
  }

  const dispo = response.headers["content-disposition"] || "";
  const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(dispo);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || "archivo.pdf");

  const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/pdf" });
  const urlBlob = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = urlBlob;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlBlob);
}

export const uploadPdf = async (file: File, onProgress?: (p: number) => void) => {
  const fd = new FormData();
  fd.append("file", file, file.name);
  
  const response = await axios.post("/api/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (ev) => {
      if (ev.total) {
        const percent = Math.round((ev.loaded * 100) / ev.total);
        onProgress?.(percent);
      }
    },
  });
  
  // Retornar los datos de la respuesta en lugar de toda la respuesta
  return response.data;
};