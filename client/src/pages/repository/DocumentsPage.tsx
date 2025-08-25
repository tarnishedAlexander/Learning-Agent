import { Navigate } from "react-router-dom";
import { Card, Space, Button } from "antd";
import { UploadOutlined, ArrowLeftOutlined, FileTextOutlined } from "@ant-design/icons";

export function DocumentsPage() {
  // Redirigir automáticamente a la página de upload que ahora contiene el tablero
  return <Navigate to="/upload-pdf" replace />;
}

// Componente alternativo si quieres mantener esta página con un mensaje
export function DocumentsPageWithMessage() {
  return (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Card style={{ maxWidth: 600, margin: "0 auto" }}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <h1 style={{ color: "#1A2A80", marginBottom: 8, display: "flex", alignItems: "center" }}>
                <FileTextOutlined style={{ marginRight: "12px" }} />
                Gestión de Documentos
              </h1>
              <p style={{ color: "#666", fontSize: "16px" }}>
                La funcionalidad de documentos se ha movido a la página de subida de PDFs
                para una mejor experiencia de usuario.
              </p>
            </div>
            
            <Button 
              type="primary" 
              size="large"
              icon={<UploadOutlined />}
              href="/upload-pdf"
              style={{ 
                backgroundColor: "#1A2A80",
                borderColor: "#1A2A80"
              }}
            >
              Ir a Subir PDFs y Ver Documentos
            </Button>
            
            <Button 
              type="default" 
              icon={<ArrowLeftOutlined />}
              href="/"
              style={{ marginTop: "10px" }}
            >
              Volver al Inicio
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
