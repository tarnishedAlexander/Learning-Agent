import React, { useState } from "react";
import { Row, Col, Button, Modal, Upload, Select, Card } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "rc-upload/lib/interface";
import { useDocuments } from "../hooks/useDocuments"; 

const { Dragger } = Upload;
const { Option } = Select;

type UseDocumentsReturn = {
  documents?: unknown[];
  addDocument?: (file: File, type: string) => Promise<unknown>;
  loadDocuments?: () => Promise<unknown>;
};

const MAX_BYTES = 10 * 1024 * 1024; 

const Uploader: React.FC = () => {
  const docsHook = useDocuments() as UseDocumentsReturn;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedType, setPickedType] = useState<string>("tipo1");
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [successModal, setSuccessModal] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: "",
  });

  const validateFile = (file: File): string | null => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "No se pueden subir archivos que no sean PDFs.";
    if (file.size > MAX_BYTES)
      return "No se pueden subir archivos mayores a 10 MB.";
    return null;
  };

  const handleConfirmUpload = async () => {
    if (!pickedFile) {
      setErrorModal({ open: true, msg: "Debes seleccionar un archivo primero." });
      return;
    }
    const v = validateFile(pickedFile);
    if (v) {
      setErrorModal({ open: true, msg: v });
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      if (typeof docsHook?.addDocument === "function") {
        await docsHook.addDocument(pickedFile, pickedType);
      } else {
        await new Promise((res) => setTimeout(res, 1500)); 
      }

      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setIsModalOpen(false);
        setPickedFile(null);
        setProgress(0);
        setSuccessModal(true); 
      }, 800);
    } catch {
      setErrorModal({
        open: true,
        msg: "Error al subir el archivo. Intenta nuevamente.",
      });
    }
  };

  const beforeUpload = (file: RcFile) => {
    const v = validateFile(file as File);
    if (v) {
      setErrorModal({ open: true, msg: v });
      return Upload.LIST_IGNORE;
    }
    setPickedFile(file as File);
    return false;
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={18}>
          <Card
            bordered
            style={{
              minHeight: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center", color: "rgba(0,0,0,0.35)" }}>
              <h3 style={{ margin: 0 }}>tabla fabian</h3>
              <p style={{ marginTop: 8 }}>
                Aquí se mostrará la tabla de archivos (placeholder)
              </p>
            </div>
          </Card>
        </Col>

        <Col
          xs={24}
          md={6}
          style={{ display: "flex", justifyContent: "flex-end", alignItems: "start" }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{ width: "100%", maxWidth: 220 }}
          >
            Agregar
          </Button>
        </Col>
      </Row>

      <Modal
        title="Agregar archivo"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setPickedFile(null);
          setProgress(0);
        }}
        onOk={handleConfirmUpload}
        okText="Confirmar"
        cancelText="Cancelar"
        centered
        confirmLoading={uploading}
      >
        <div style={{ marginBottom: 12 }}>
          <Dragger
            multiple={false}
            accept=".pdf,application/pdf"
            beforeUpload={beforeUpload}
            showUploadList={false}
            style={{ padding: 12 }}
          >
            <p style={{ margin: 0 }}>
              Arrastra tu PDF aquí o haz clic para seleccionar.
            </p>
            <p style={{ marginTop: 8, color: "rgba(0,0,0,0.45)" }}>
              Solo PDF; máximo 10 MB.
            </p>
          </Dragger>
        </div>

        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <Button
            icon={<UploadOutlined />}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,application/pdf";
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (!f) return;
                const v = validateFile(f);
                if (v) {
                  setErrorModal({ open: true, msg: v });
                  return;
                }
                setPickedFile(f);
              };
              input.click();
            }}
          >
            Seleccionar archivo
          </Button>

          <Select
            value={pickedType}
            onChange={(v) => setPickedType(v)}
            style={{ minWidth: 140 }}
          >
            <Option value="tipo1">tipo1</Option>
            <Option value="tipo2">tipo2</Option>
            <Option value="tipo3">tipo3</Option>
            <Option value="tipo4">tipo4</Option>
          </Select>
        </div>

        <div>
          <div style={{ minHeight: 36 }}>
            {pickedFile ? (
              <div>
                <strong>{pickedFile.name}</strong>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                  {(pickedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div style={{ color: "rgba(0,0,0,0.45)" }}>
                No hay archivo seleccionado
              </div>
            )}
          </div>

          {uploading && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  height: 8,
                  background: "#f0f0f0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#1890ff",
                    transition: "width 400ms",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={successModal}
        onCancel={() => setSuccessModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setSuccessModal(false)}>
            Aceptar
          </Button>,
        ]}
        centered
      >
        <h3>✅ Carga exitosa</h3>
        <p>El archivo se ha subido correctamente.</p>
      </Modal>

      <Modal
        open={errorModal.open}
        onCancel={() => setErrorModal({ open: false, msg: "" })}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setErrorModal({ open: false, msg: "" })}
          >
            Aceptar
          </Button>,
        ]}
        centered
      >
        <h3>⚠️ Error al subir</h3>
        <p>{errorModal.msg}</p>
      </Modal>
    </div>
  );
};

export default Uploader;
