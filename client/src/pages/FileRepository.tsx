import { useRef, useState } from "react";
import { CloudUploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Flex, Alert, Spin } from "antd";
import useFiles from "../hooks/useFiles";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileRepository() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showUploading, setShowUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFiles();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica tamaño
    if (file.size > MAX_SIZE) {
      setErrorMsg("El archivo supera los 10MB.");
      setShowError(true);
      setTimeout(() => setShowError(false), 8000);
      event.target.value = "";
      return;
    }

    setLoading(true);
    setShowSuccess(false);
    setShowError(false);
    setShowUploading(true);

    // Spinner mínimo 5s
    const minUploadTime = new Promise((resolve) => setTimeout(resolve, 5000));
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let uploadTimedOut = false;

    // Timeout de 5s
    const uploadTimeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        uploadTimedOut = true;
        reject(new Error("La subida tomó más de 5 segundos."));
      }, 5000);
    });

    try {
      const uploadPromise = uploadFile(file);
      await Promise.race([uploadPromise, uploadTimeout]);
      await minUploadTime;

      if (uploadTimedOut) return;

      setShowUploading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000);
      event.target.value = "";
    } catch (err: unknown) {
      let message = "Error al subir el archivo";
      if (err instanceof Error) {
        message =
          err.message === "La subida tomó más de 5 segundos."
            ? err.message
            : "Error al subir el archivo";
      }
      setErrorMsg(message);
      setShowError(true);
      setTimeout(() => setShowError(false), 8000);
    } finally {
      setLoading(false);
      setShowUploading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return (
    <Flex vertical align="center" justify="center">
      <h1>File Repository</h1>
      <p>Sube tus archivos aquí.</p>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleUpload}
      />
      <Button
        type="primary"
        icon={<CloudUploadOutlined />}
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        Upload File
      </Button>
      {showUploading && (
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />}
          style={{ marginTop: 24, marginBottom: 8 }}
          tip="Subiendo archivo..."
        />
      )}
      {showSuccess && (
        <Alert
          message="Archivo subido correctamente"
          type="success"
          showIcon
          style={{ marginTop: 16, width: 300 }}
        />
      )}
      {showError && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          style={{ marginTop: 16, width: 300 }}
        />
      )}
    </Flex>
  );
}
