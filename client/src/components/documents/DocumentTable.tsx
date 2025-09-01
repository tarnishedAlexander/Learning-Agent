import { useState } from 'react';
import type { Key } from 'react';
import { Table, Button, Space, Radio, Tooltip, Grid, Typography } from 'antd';
import type { TablePaginationConfig, SorterResult, FilterValue } from 'antd/es/table/interface';
import { DownloadOutlined, EyeOutlined, FileTextOutlined, FilterOutlined, FilterFilled } from '@ant-design/icons';
import DeleteButton from '../safetyModal';
import type { Document } from '../../interfaces/documentInterface';

const { useBreakpoint } = Grid;
const { Text } = Typography;

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
  const screens = useBreakpoint();
  const isSmallScreen = !screens.lg;

  // Filter key types for the size column
  type SizeFilterKey = 'lt_100kb' | '100kb_1mb' | '1mb_5mb' | 'gt_5mb';

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
      title: (
        <Tooltip title={getSortTooltip('originalName')}>
          <div style={{ display: 'block', width: '100%', paddingRight: 40 }}>
            <span style={{ display: 'inline-block' }}>Nombre del archivo</span>
          </div>
        </Tooltip>
      ),
      dataIndex: 'originalName',
      key: 'originalName',
      sorter: (a: Document, b: Document) => a.originalName.localeCompare(b.originalName),
      showSorterTooltip: false,
      ellipsis: true,
      width: isSmallScreen ? undefined : '40%',
      render: (text: string) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '8px'
        }}>
          <FileTextOutlined style={{ 
            color: '#1A2A80', 
            fontSize: isSmallScreen ? '14px' : '16px',
            flexShrink: 0 
          }} />
          <Text 
            style={{ 
              fontSize: isSmallScreen ? '12px' : '14px',
              fontWeight: '500'
            }}
            ellipsis={{ tooltip: text }}
          >
            {text}
          </Text>
        </div>
      ),
    },
    ...(!isSmallScreen ? [{
      title: (
        <Tooltip title={getSortTooltip('uploadedAt')}>
          <div style={{ display: 'block', width: '100%', paddingRight: 40 }}>
            <span style={{ display: 'inline-block' }}>Fecha de subida</span>
          </div>
        </Tooltip>
      ),
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: '20%',
      sorter: (a: Document, b: Document) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
      showSorterTooltip: false,
      render: (date: string) => (
        <Text style={{ fontSize: '14px' }}>
          {new Date(date).toLocaleDateString('es-ES')}
        </Text>
      ),
    },
    {
      title: (
        <Tooltip title={getSortTooltip('size')}>
          <div style={{ display: 'block', width: '100%', paddingRight: 40 }}>
            <span style={{ display: 'inline-block' }}>Tamaño</span>
          </div>
        </Tooltip>
      ),
      dataIndex: 'size',
      key: 'size',
      showSorterTooltip: false,
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
      width: '15%',
      render: (size: number) => {
        const kb = size / 1024;
        const displaySize = kb < 1024 ? `${kb.toFixed(2)} KB` : `${(kb / 1024).toFixed(2)} MB`;
        return (
          <Text style={{ fontSize: '14px' }}>
            {displaySize}
          </Text>
        );
      },
    }] : []),
    {
      title: 'Acciones',
      key: 'actions',
      width: isSmallScreen ? undefined : '25%',
      render: (_: unknown, record: Document) => (
        <Space 
          direction={isSmallScreen ? "vertical" : "horizontal"}
          size={isSmallScreen ? "small" : "middle"}
          style={{ width: '100%' }}
        >
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onPreview?.(record)}
            style={{ 
              color: '#1A2A80',
              fontWeight: '500',
              fontSize: isSmallScreen ? '12px' : '14px',
              padding: isSmallScreen ? '2px 4px' : '4px 8px'
            }}
            size={isSmallScreen ? "small" : "middle"}
          >
            {isSmallScreen ? "Ver" : "Previsualizar"}
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => onDownload?.(record)}
            style={{ 
              color: '#3B38A0',
              fontWeight: '500',
              fontSize: isSmallScreen ? '12px' : '14px',
              padding: isSmallScreen ? '2px 4px' : '4px 8px'
            }}
            size={isSmallScreen ? "small" : "middle"}
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
              size: isSmallScreen ? "small" : "middle"
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
        pageSize: isSmallScreen ? 5 : 10,
        showQuickJumper: !isSmallScreen,
        showSizeChanger: !isSmallScreen,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} de ${total} documentos`,
        style: { marginTop: '16px' },
        size: isSmallScreen ? 'small' : 'default'
      }}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
      }}
      className="academic-table"
      locale={{
        emptyText: isSmallScreen ? 'Sin documentos' : 'No hay documentos en el repositorio'
      }}
      scroll={{ 
        x: isSmallScreen ? 300 : 800,
        y: isSmallScreen ? 400 : undefined
      }}
      size={isSmallScreen ? "small" : "middle"}
    />
  );
};