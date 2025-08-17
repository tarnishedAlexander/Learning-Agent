import axios from "axios";

export const uploadPdf = (file: File, onProgress?: (p: number) => void) => {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return axios.post("/api/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (ev) => {
      if (ev.total) {
        const percent = Math.round((ev.loaded * 100) / ev.total);
        onProgress?.(percent);
      }
    },
  });
};
