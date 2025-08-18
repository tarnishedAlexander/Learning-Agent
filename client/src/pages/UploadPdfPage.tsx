import React, { useState } from "react";
import { Card, Alert } from "antd";
import PdfUploader from "../components/PdfUploader";
import useFiles from "../hooks/useFiles";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UploadPdfPage: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { uploadFile } = useFiles();

  const handleComplete = async (file: File) => {
    console.log("Archivo recibido:", file.name, file.type, file.size);

    // Verificar que sea PDF
    if (file.type !== "application/pdf") {
      console.log("Archivo rechazado: no es PDF");
      setErrorMsg("El archivo debe ser un PDF.");
      setShowError(true);
      setShowSuccess(false);
      setTimeout(() => setShowError(false), 8000);
      return;
    }

    // Verificar tamaño (10MB máximo)
    if (file.size > MAX_SIZE) {
      console.log("Archivo rechazado: supera 10MB");
      setErrorMsg("El archivo supera los 10MB.");
      setShowError(true);
      setShowSuccess(false);
      setTimeout(() => setShowError(false), 8000);
      return;
    }

    try {
      console.log("Iniciando subida...");
      const result = await uploadFile(file);
      console.log("Subida exitosa:", result);

      setShowSuccess(true);
      setShowError(false);
      setTimeout(() => setShowSuccess(false), 8000);
    } catch (error) {
      console.error("Error en la subida:", error);
      setErrorMsg("Error al subir el archivo.");
      setShowError(true);
      setShowSuccess(false);
      setTimeout(() => setShowError(false), 8000);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Card title="Subir PDF" style={{ maxWidth: 900 }}>
        <PdfUploader onUploadComplete={handleComplete} />

        {showSuccess && (
          <Alert
            message="Operación exitosa"
            description="El archivo PDF se ha subido correctamente."
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {showError && (
          <Alert
            message="Error"
            description={errorMsg}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
};

export default UploadPdfPage;
