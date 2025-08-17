import { fileService } from "../services/fileService";
import { useFileStore } from "../store/fileStore";

const useFiles = () => {
    const { files, upload } = useFileStore();

    const uploadFile = async (file: File) => {
        try {
            const newFile = await fileService.uploadFile(file);
            upload(newFile);
            return newFile; // Retorna el archivo en lugar de un objeto status
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error; // Lanza la excepción en lugar de retornar un objeto
        }
    };

    return {
        files,
        uploadFile,
    };
};

export default useFiles;