import React, { useState, useEffect } from 'react';
import { Button, Typography, Spin, Alert } from 'antd';
import { CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Document } from '../../interfaces/documentInterface';
import { documentsApi } from '../../services/api/documentsApi';

const { Title, Text } = Typography;

interface PdfPreviewSidebarProps {
  document: Document | null;
  onClose: () => void;
  visible: boolean;
}

export const PdfPreviewSidebar: React.FC<PdfPreviewSidebarProps> = ({
  document,
  onClose,
  visible,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document && visible) {
      loadPdfUrl();
    } else {
      setPdfUrl(null);
      setError(null);
    }
  }, [document, visible]);

  const loadPdfUrl = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);
    
    try {
      const signedUrl = await documentsApi.getDownloadUrl(document.fileName);
      setPdfUrl(signedUrl);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Error al cargar el PDF para previsualización');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #E8E8E8',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E8E8E8',
          backgroundColor: '#F8F9FA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#1A2A80', fontSize: '18px' }} />
          <div>
            <Title level={5} style={{ margin: 0, color: '#1A2A80' }}>
              Previsualización de PDF
            </Title>
            {document && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {document.originalName}
              </Text>
            )}
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{
            color: '#666666',
            fontSize: '16px',
            padding: '4px',
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <Spin size="large" />
            <Text style={{ marginLeft: '12px' }}>Cargando PDF...</Text>
          </div>
        )}

        {error && (
          <Alert
            message="Error de previsualización"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {pdfUrl && !loading && !error && (
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
            title={`PDF Preview: ${document?.originalName}`}
          />
        )}

        {!document && !loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#999999',
            }}
          >
            <Text>Selecciona un documento para previsualizar</Text>
          </div>
        )}
      </div>
    </div>
  );
};
