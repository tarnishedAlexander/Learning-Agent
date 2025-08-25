import { Table, Button, Space } from 'antd';
import { DownloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { Document } from '../../interfaces/documentInterface';

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  onDelete?: (fileName: string) => Promise<void>;
  onDownload?: (doc: Document) => Promise<void>;
  onPreview?: (doc: Document) => void;
}

export const DocumentTable = ({ documents, loading, onDelete, onDownload, onPreview }: DocumentTableProps) => {
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
            icon={<DownloadOutlined />}
            onClick={() => onDownload?.(record)}
            style={{ 
              color: '#3B38A0',
              fontWeight: '500'
            }}
          >
            Descargar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete?.(record.fileName)}
            style={{
              color: '#B22B0E8',
              fontWeight: '500'
            }}
          >
            Eliminar
          </Button>
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
