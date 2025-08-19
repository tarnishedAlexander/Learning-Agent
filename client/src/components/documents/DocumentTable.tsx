import { Table, Button, Space } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Document } from '../../interfaces/documentInterface';

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  onDelete?: (id: string) => Promise<void>; // Opcional ya que será implementado después
}

export const DocumentTable = ({ documents, loading }: DocumentTableProps) => {
  const columns = [
    {
      title: 'Nombre del archivo',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Document, b: Document) => a.name.localeCompare(b.name),
    },
    {
      title: 'Fecha de subida',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      sorter: (a: Document, b: Document) => 
        new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString('es-ES'),
    },
    {
      title: 'Tamaño',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => {
        const kb = size / 1024;
        if (kb < 1024) {
          return `${kb.toFixed(2)} KB`;
        }
        const mb = kb / 1024;
        return `${mb.toFixed(2)} MB`;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: Document) => (
        <Space>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            disabled
            style={{ color: '#3B38A0' }}
          >
            Descargar
          </Button>
          <Button 
            type="link" 
            disabled
            danger 
            icon={<DeleteOutlined />}
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
      rowKey="id"
      pagination={{ pageSize: 10 }}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    />
  );
};
