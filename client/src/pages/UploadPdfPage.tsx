import React from "react";
import { Card } from "antd";
import Uploader from "../components/Uploader";

const UploadPdfPage: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <Card title="Subir PDF" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Uploader />
      </Card>
    </div>
  );
};

export default UploadPdfPage;
