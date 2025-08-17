import { create } from "zustand";
import type { fileInterface } from "../interfaces/fileInterface";

interface FileStore {
    files: fileInterface[];
    upload: (file: fileInterface) => void;
    // removeFile: (id: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
    files: [],
    upload: (file) => set((state) => ({ files: [...state.files, file] })),
    // removeFile: (id) => set((state) => ({ files: state.files.filter((file) => file.id !== id) })),
}));
