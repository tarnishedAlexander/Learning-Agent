import { uploadPdf } from "../services/fileService";
import { useFileStore } from "../store/fileStore";
import type { Document } from "../interfaces/documentInterface";

const useFiles = () => {
    const { files, upload } = useFileStore();

    const uploadFile = async (file: File): Promise<Document> => {
        try {
            const newFile = await uploadPdf(file);
            upload(newFile);
            return newFile;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    };

    return {
        files,
        uploadFile,
    };
};

export default useFiles;