import { create } from "zustand";
import type { Document } from "../interfaces/documentInterface";

interface FileStore {
    files: Document[];
    upload: (file: Document) => void;
    // removeFile: (id: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
    files: [],
    upload: (file) => set((state) => ({ files: [...state.files, file] })),
    // removeFile: (id) => set((state) => ({ files: state.files.filter((file) => file.id !== id) })),
}));
