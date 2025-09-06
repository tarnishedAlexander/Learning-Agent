import React from 'react';
import { Table, Button, Space, Tooltip, theme as antTheme, Grid } from 'antd';
import { DownloadOutlined, EyeOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../store/themeStore';
import DeleteButton from '../safetyModal';
import type { Document } from '../../interfaces/documentInterface';

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  onDelete?: (documentId: string) => Promise<void>;
  onDownload?: (doc: Document) => Promise<void>;
  onPreview?: (doc: Document) => void;
  onViewData?: (doc: Document) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  loading,
  onDelete,
  onDownload,
  onPreview,
  onViewData,
  onDeleteSuccess,
  onDeleteError
}) => {
  // Theme
  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();

  // Breakpoints
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const showPreviewButton = Boolean(screens.lg);

  const columns = [
    {
      title: (
        <Tooltip title="Haz clic para ordenar alfabéticamente por nombre">
          <span style={{ cursor: 'pointer' }}>Nombre del archivo</span>
        </Tooltip>
      ),
      dataIndex: 'originalName',
      key: 'originalName',
      sorter: (a: Document, b: Document) => a.originalName.localeCompare(b.originalName),
      showSorterTooltip: {
        title: 'Ordenar por nombre de archivo'
      },
      render: (text: string) =>
        text.length > 25 ? `${text.substring(0, 25)}...` : text,
    },
    {
      title: (
        <Tooltip title="Haz clic para ordenar por fecha de subida">
          <span style={{ cursor: 'pointer' }}>Fecha de subida</span>
        </Tooltip>
      ),
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      sorter: (a: Document, b: Document) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
      showSorterTooltip: {
        title: 'Ordenar por fecha de subida'
      },
      render: (date: string) => new Date(date).toLocaleDateString('es-ES'),
    },
    {
      title: (
        <Tooltip title="Haz clic para ordenar por tamaño de archivo">
          <span style={{ cursor: 'pointer' }}>Tamaño</span>
        </Tooltip>
      ),
      dataIndex: 'size',
      key: 'size',
      sorter: (a: Document, b: Document) => a.size - b.size,
      showSorterTooltip: {
        title: 'Ordenar por tamaño de archivo'
      },
      render: (size: number) => {
        const kb = size / 1024;
        if (kb < 1024) return `${kb.toFixed(2)} KB`;
        return `${(kb / 1024).toFixed(2)} MB`;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: Document) => (
        <Space>
          {showPreviewButton && (
            <Tooltip title="Ver PDF en pantalla completa">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => onPreview?.(record)}
                style={{
                  color: isDark ? token.colorPrimary : '#1A2A80',
                  fontWeight: '500'
                }}
              >
                Previsualizar
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Ver contenido extraído del documento">
            <Button
              type="link"
              icon={<BookOutlined />}
              onClick={() => onViewData?.(record)}
              style={{
                color: isDark ? token.colorSuccess : '#52C41A',
                fontWeight: '500'
              }}
            >
              Datos
            </Button>
          </Tooltip>

          <Tooltip title="Descargar archivo PDF">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => onDownload?.(record)}
              style={{
                color: isDark ? token.colorInfo : '#3B38A0',
                fontWeight: '500'
              }}
            >
              Descargar
            </Button>
          </Tooltip>

          <DeleteButton
            onDelete={() => onDelete?.(record.id) || Promise.resolve()}
            resourceInfo={{
              name: record.originalName,
              type: "Documento PDF",
              icon: <FileTextOutlined />,
              additionalInfo: `Tamaño: ${(record.size / 1024 / 1024).toFixed(2)} MB`
            }}
            buttonConfig={{
              variant: "link",
              showText: true,
              size: "middle"
            }}
            modalConfig={{
              message: "¿Estás seguro de que deseas eliminar este documento?",
              confirmText: "Eliminar Documento"
            }}
            onDeleteSuccess={onDeleteSuccess}
            onDeleteError={onDeleteError}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={documents}
      loading={loading}
      rowKey="fileName"
      pagination={{
        pageSize: 10,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} de ${total} documentos`,
        style: { marginTop: '16px' }
      }}
      style={{
        backgroundColor: isDark ? token.colorBgContainer : '#FFFFFF',
        borderRadius: '8px',
      }}
      className="academic-table"
      locale={{
        emptyText: 'No hay documentos en el repositorio',
        triggerDesc: 'Ordenar descendente',
        triggerAsc: 'Ordenar ascendente',
        cancelSort: 'Cancelar ordenamiento'
      }}
      scroll={{ x: 800 }}
      size="middle"
    />
  );
};