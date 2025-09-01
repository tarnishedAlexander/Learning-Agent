import { useState } from 'react';
import type { Key } from 'react';
import { Table, Button, Space, Tooltip } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table/interface';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { DownloadOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import DeleteButton from '../safetyModal';
import type { Document } from '../../interfaces/documentInterface';

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  onDelete?: (fileName: string) => Promise<void>;
  onDownload?: (doc: Document) => Promise<void>;
  onPreview?: (doc: Document) => void;
  // Nuevas props para el DeleteButton
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}

export const DocumentTable = ({ 
  documents, 
  loading, 
  onDelete, 
  onDownload, 
  onPreview,
  onDeleteSuccess,
  onDeleteError 
}: DocumentTableProps) => {
  // Mantener el estado del sorter activo para mostrar tooltips dinámicos
  const [sorterState, setSorterState] = useState<{
    columnKey?: Key;
    order?: 'ascend' | 'descend' | null;
  } | null>(null);

  const getSortTooltip = (columnKey: string) => {
    if (!sorterState || sorterState.columnKey !== columnKey) {
      return 'Haz clic para ordenar de forma ascendente';
    }
    if (sorterState.order === 'ascend') return 'Haz clic para ordenar de forma descendente';
    if (sorterState.order === 'descend') return 'Haz clic para cancelar el orden';
    return 'Haz clic para ordenar de forma ascendente';
  };

  const handleTableChange = (
    _pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Document> | SorterResult<Document>[]
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
  setSorterState({ columnKey: s?.columnKey as Key, order: s?.order ?? null });
  };
  const columns = [
    {
      title: (
        <Tooltip title={getSortTooltip('originalName')}>
          <div style={{ display: 'block', width: '100%', paddingRight: 40 }}>
            <span style={{ display: 'inline-block' }}>Nombre del archivo</span>
          </div>
        </Tooltip>
      ),
      dataIndex: 'originalName',
      key: 'originalName',
      showSorterTooltip: false,
      sorter: (a: Document, b: Document) => a.originalName.localeCompare(b.originalName),
    },
    {
      title: (
        <Tooltip title={getSortTooltip('uploadedAt')}>
          <div style={{ display: 'block', width: '100%', paddingRight: 40 }}>
            <span style={{ display: 'inline-block' }}>Fecha de subida</span>
          </div>
        </Tooltip>
      ),
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      showSorterTooltip: false,
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
          <DeleteButton
            onDelete={() => onDelete?.(record.fileName) || Promise.resolve()}
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
  onChange={handleTableChange}
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