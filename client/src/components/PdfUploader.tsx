import React, { useState } from "react";
import { Upload, Button, Progress, Alert, Typography } from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import axios from "axios";

const { Dragger } = Upload;
const { Text } = Typography;

interface PdfUploaderProps {
  onUploadComplete?: (file: File, response?: unknown) => void;
  uploadUrl?: string;
  disabled?: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;

type CustomReqOptions = {
  file: File | Blob | string;
  onProgress?: (event: { percent: number }, file: File | Blob | string) => void;
  onSuccess?: (result?: unknown) => void;
  onError?: (err?: unknown) => void;
  [key: string]: unknown;
};

const PdfUploader: React.FC<PdfUploaderProps> = ({
  onUploadComplete,
  uploadUrl,
  disabled,
}) => {
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const beforeUpload = (file: File) => {
    setError(null);
    setSuccess(null);

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      const msg = "Formato inválido: solo se permiten archivos PDF.";
      setError(msg);
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_BYTES) {
      const msg = "Archivo muy grande: máximo 10 MB.";
      setError(msg);
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const customRequest = async (options: CustomReqOptions): Promise<void> => {
    const { file: rawFile, onProgress, onSuccess, onError } = options;

    const file = rawFile instanceof File ? rawFile : (rawFile as File);

    setError(null);
    setSuccess(null);
    setUploading(true);
    setPercent(0);
    setSelectedFileName((file as File)?.name ?? String(rawFile ?? ""));

    if (!uploadUrl) {
      let cur = 0;
      const timer = setInterval(() => {
        cur += 12;
        if (cur > 100) cur = 100;
        setPercent(cur);
        onProgress?.({ percent: cur }, file);
        if (cur >= 100) {
          clearInterval(timer);
          setUploading(false);
          setPercent(100);
          setSuccess(`${(file as File).name || "Archivo"} listo.`);
          onSuccess?.("ok");
          onUploadComplete?.(file as File, { simulated: true });
        }
      }, 150);
      return;
    }

    try {
      const f = file as File;
      const form = new FormData();
      form.append("file", f, f.name);

      const resp = await axios.post(uploadUrl, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const p = Math.round((ev.loaded * 100) / ev.total);
            setPercent(p);
            onProgress?.({ percent: p }, file);
          }
        },
      });

      setUploading(false);
      setPercent(100);
      setSuccess(`${f.name} subido correctamente.`);
      onSuccess?.(resp.data);
      onUploadComplete?.(f, resp.data);
    } catch (errUnknown: unknown) {
      setUploading(false);
      const normalizedError =
        errUnknown instanceof Error
          ? errUnknown
          : new Error(String(errUnknown));
      const errMsg = normalizedError.message || "Error al subir archivo";
      setError(`Error al subir: ${errMsg}`);

      try {
        onError?.(normalizedError);
      } catch (cbErr: unknown) {
        const cbMsg = cbErr instanceof Error ? cbErr.message : String(cbErr);
        setError((prev) => `${prev} (onError callback falló: ${cbMsg})`);
      }
    }
  };

  const props: UploadProps = {
    multiple: false,
    accept: ".pdf,application/pdf",
    showUploadList: false,
    beforeUpload,
    customRequest: customRequest as unknown as UploadProps["customRequest"],
    disabled,
  };

  return (
    <div className="w-full max-w-2xl">
      <Dragger {...props} style={{ padding: 12, borderRadius: 8 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Arrastra un archivo PDF aquí</p>
        <p className="ant-upload-hint">
          O usa el botón para seleccionar un archivo. Máx 10 MB. Solo PDF.
        </p>
      </Dragger>

      <div
        style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}
      >
        <Upload {...props}>
          <Button icon={<UploadOutlined />} disabled={disabled || uploading}>
            Seleccionar archivo
          </Button>
        </Upload>

        {selectedFileName && (
          <Text ellipsis style={{ maxWidth: 220 }}>
            {selectedFileName}
          </Text>
        )}
      </div>

      {uploading && (
        <div style={{ marginTop: 12 }}>
          <Progress percent={percent} />
          <Text type="secondary">Subiendo... {percent}%</Text>
        </div>
      )}

      {success && (
        <div style={{ marginTop: 12 }}>
          <Alert
            message="Éxito"
            description={success}
            type="success"
            showIcon
            closable
            onClose={() => setSuccess(null)}
          />
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12 }}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
