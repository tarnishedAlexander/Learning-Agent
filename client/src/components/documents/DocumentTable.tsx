import React, { useState } from 'react';
import { Table, Button, Space, Radio, Tooltip } from 'antd';
import type { Key } from 'react';
import { DownloadOutlined, EyeOutlined, FileTextOutlined, FilterOutlined, FilterFilled } from '@ant-design/icons';
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
  // Filter key types for the size column
  type SizeFilterKey = 'lt_100kb' | '100kb_1mb' | '1mb_5mb' | 'gt_5mb';

  // Componente interno para el dropdown de filtro de tamaño (etiquetas en español)
  type SizeDropdownProps = {
    setSelectedKeys: (keys: Key[]) => void;
    selectedKeys: Key[];
    confirm: () => void;
    clearFilters?: () => void;
  };

  const SizeFilterDropdown: React.FC<SizeDropdownProps> = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
    const [local, setLocal] = useState<string | undefined>(selectedKeys?.[0] as string | undefined);

    return (
      <div style={{ padding: 12, maxWidth: 220 }}>
        <Radio.Group
          onChange={(e) => {
            const val = e.target.value as string;
            setLocal(val);
            // aplicar inmediatamente
            setSelectedKeys(val ? [val] : []);
            confirm();
          }}
          value={local}
        >
          <Radio value={'lt_100kb'}>{'< 100 KB'}</Radio>
          <div style={{ height: 8 }} />
          <Radio value={'100kb_1mb'}>{'100 KB - 1 MB'}</Radio>
          <div style={{ height: 8 }} />
          <Radio value={'1mb_5mb'}>{'1 MB - 5 MB'}</Radio>
          <div style={{ height: 8 }} />
          <Radio value={'gt_5mb'}>{'> 5 MB'}</Radio>
        </Radio.Group>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Tooltip title="Restablecer filtros">
            <Button
              size="small"
              onClick={() => {
                setLocal(undefined);
                setSelectedKeys([]);
                clearFilters?.();
                confirm();
              }}
            >
              Restablecer
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  };
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
      sorter: (a: Document, b: Document) => a.size - b.size,
      filters: [
        { text: '< 100 KB', value: 'lt_100kb' },
        { text: '100 KB - 1 MB', value: '100kb_1mb' },
        { text: '1 MB - 5 MB', value: '1mb_5mb' },
        { text: '> 5 MB', value: 'gt_5mb' },
      ],
      filterMultiple: false,
  filterDropdown: (props: SizeDropdownProps) => <SizeFilterDropdown {...props} />,
      filterIcon: (filtered: boolean) => (
        <Tooltip title={filtered ? 'Filtro activo' : 'Filtrar por tamaño'}>
          {filtered ? <FilterFilled style={{ color: '#1A2A80' }} /> : <FilterOutlined />}
        </Tooltip>
      ),
      onFilter: (value: boolean | Key, record: Document) => {
        const size = record.size;
        const key = String(value) as SizeFilterKey;
        switch (key) {
          case 'lt_100kb':
            return size < 100 * 1024;
          case '100kb_1mb':
            return size >= 100 * 1024 && size < 1 * 1024 * 1024;
          case '1mb_5mb':
            return size >= 1 * 1024 * 1024 && size < 5 * 1024 * 1024;
          case 'gt_5mb':
            return size >= 5 * 1024 * 1024;
          default:
            return true;
        }
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