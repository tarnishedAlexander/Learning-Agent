import { Table, Button, Space } from 'antd';
import { DownloadOutlined, EyeOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
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

export const DocumentTable = ({ 
  documents, 
  loading, 
  onDelete, 
  onDownload, 
  onPreview,
  onViewData,
  onDeleteSuccess,
  onDeleteError 
}: DocumentTableProps) => {
  const columns = [
    {
      title: 'Nombre del archivo',
      dataIndex: 'originalName',
      key: 'originalName',
      sorter: (a: Document, b: Document) => a.originalName.localeCompare(b.originalName),
    },
    {
      title: 'Fecha de subida',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      sorter: (a: Document, b: Document) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString('es-ES'),
    },
    {
      title: 'Tamaño',
      dataIndex: 'size',
      key: 'size',
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
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onPreview?.(record)}
            style={{ 
              color: '#1A2A80',
              fontWeight: '500'
            }}
          >
            Previsualizar
          </Button>
          <Button
            type="link"
            icon={<BookOutlined />}
            onClick={() => onViewData?.(record)}
            style={{ 
              color: '#52C41A',
              fontWeight: '500'
            }}
            title="Ver datos extraídos"
          >
            Datos
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => onDownload?.(record)}
            style={{ 
              color: '#3B38A0',
              fontWeight: '500'
            }}
          >
            Descargar
          </Button>
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
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
      }}
      className="academic-table"
      locale={{
        emptyText: 'No hay documentos en el repositorio'
      }}
      scroll={{ x: 800 }}
      size="middle"
    />
  );
};