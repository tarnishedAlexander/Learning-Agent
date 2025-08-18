import React from "react";
import { Card } from "antd";
import PdfUploader from "../components/PdfUploader";

const UploadPdfPage: React.FC = () => {
  const handleComplete = (file: File, response?: unknown) => {
    console.log("Archivo finalizado:", file);
    console.log("Respuesta del servidor (si hubiera):", response);
  };

  return (
    <div style={{ padding: 20 }}>
      <Card title="Subir PDF" style={{ maxWidth: 900 }}>
        <PdfUploader onUploadComplete={handleComplete} />
      </Card>
    </div>
  );
};

export default UploadPdfPage;
