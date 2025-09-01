import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Button, 
  Typography, 
  Alert, 
  Tabs, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Space, 
  Tag, 
  Input,
  Select,
  Pagination,
  Tooltip,
  message,
  Skeleton,
  Empty,
  Progress,
  theme as antTheme
} from 'antd';
import { useThemeStore } from '../../store/themeStore';
import { 
  CloseOutlined, 
  FileTextOutlined, 
  DownloadOutlined, 
  SyncOutlined, 
  SearchOutlined,
  CopyOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { Document, DocumentExtractedData } from '../../interfaces/documentInterface';
import { useDocuments } from '../../hooks/useDocuments';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface DocumentDataSidebarProps {
  document: Document | null;
  onClose: () => void;
  visible: boolean;
}

export const DocumentDataSidebar: React.FC<DocumentDataSidebarProps> = ({
  document,
  onClose,
  visible,
}) => {
  const { 
    getDocumentExtractedData, 
    generateDocumentEmbeddings,
    extractedDataLoading,
    extractedDataError
  } = useDocuments();

  // Theme
  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();
  
  const [extractedData, setExtractedData] = useState<DocumentExtractedData | null>(null);
  const [activeTab, setActiveTab] = useState('metadata');
  
  // Estados para funcionalidades mejoradas
  const [searchTerm, setSearchTerm] = useState('');
  const [chunkTypeFilter, setChunkTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [retryCount, setRetryCount] = useState(0);

  const documentId = document?.id;
  const isLoading = documentId ? extractedDataLoading[documentId] || false : false;
  const error = documentId ? extractedDataError[documentId] || null : null;

  const loadExtractedDataCallback = useCallback(async () => {
    if (!document?.id) {
      return;
    }

    try {
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
    } catch (error) {
      console.error('Error loading extracted data:', error);
    }
  }, [document?.id, getDocumentExtractedData]);

  useEffect(() => {
    if (document?.id && visible) {
      loadExtractedDataCallback();
    } else {
      setExtractedData(null);
    }
  }, [document?.id, visible, loadExtractedDataCallback]);

  // Funciones de utilidad mejoradas
  const copyToClipboard = async (text: string, description: string = 'Texto') => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${description} copiado al portapapeles`);
    } catch {
      message.error('Error al copiar al portapapeles');
    }
  };

  const retryLoadData = async () => {
    if (!document?.id) return;
    
    setRetryCount(prev => prev + 1);
    try {
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
      message.success('Datos recargados exitosamente');
    } catch (error) {
      console.error('Error reloading data:', error);
      message.error('Error al recargar los datos');
    }
  };

  // Lógica de filtrado y paginación de chunks
  const filteredChunks = useMemo(() => {
    if (!extractedData?.chunks) return [];
    
    return extractedData.chunks.filter(chunk => {
      const matchesSearch = searchTerm === '' || 
        chunk.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = chunkTypeFilter === 'all' || chunk.type === chunkTypeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [extractedData?.chunks, searchTerm, chunkTypeFilter]);

  const paginatedChunks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredChunks.slice(startIndex, endIndex);
  }, [filteredChunks, currentPage, pageSize]);

  // Obtener tipos únicos de chunks para el filtro
  const chunkTypes = useMemo(() => {
    if (!extractedData?.chunks) return [];
    
    const types = new Set(extractedData.chunks.map(chunk => chunk.type));
    return Array.from(types);
  }, [extractedData?.chunks]);

  const handleGenerateEmbeddings = async () => {
    if (!document?.id) return;
    
    try {
      await generateDocumentEmbeddings(document.id);
      // Recargar datos después de generar embeddings
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
    } catch (error) {
      console.error('Error generating embeddings:', error);
    }
  };

  const handleExportText = () => {
    if (!extractedData) return;

    const textContent = extractedData.chunks.map(chunk => chunk.content).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${extractedData.metadata.title || extractedData.metadata.fileName || 'documento'}_extraido.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: window.innerWidth <= 768 ? '100%' : '50%', // Responsivo
        height: '100vh',
        backgroundColor: isDark ? token.colorBgContainer : '#FFFFFF',
        boxShadow: isDark ? '-4px 0 20px rgba(91, 110, 240, 0.1)' : '-4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: visible ? 'flex' : 'none',
        flexDirection: 'column',
        borderLeft: `1px solid ${isDark ? token.colorBorder : '#E8E8E8'}`,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${isDark ? token.colorBorder : '#E8E8E8'}`,
          backgroundColor: isDark ? token.colorBgElevated : '#F8F9FA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: isDark ? token.colorPrimary : '#1A2A80', fontSize: '18px' }} />
          <div>
            <Title level={5} style={{ margin: 0, color: isDark ? token.colorPrimary : '#1A2A80' }}>
              Datos del Documento
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
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading && (
          <div style={{ padding: '16px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
              <Card>
                <Skeleton.Button active style={{ width: 200, height: 40 }} />
                <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 16 }} />
              </Card>
            </Space>
          </div>
        )}

        {error && (
          <div style={{ padding: '16px' }}>
            <Alert
              message="Error al cargar datos"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>{error}</Text>
                  {retryCount > 0 && (
                    <Text type="secondary">
                      Intentos de recarga: {retryCount}
                    </Text>
                  )}
                </Space>
              }
              type="error"
              showIcon
              action={
                <Button 
                  size="small" 
                  icon={<ReloadOutlined />}
                  onClick={retryLoadData}
                  loading={isLoading}
                >
                  Reintentar
                </Button>
              }
            />
          </div>
        )}

        {extractedData && !isLoading && !error && (
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
          >
            <TabPane tab="Metadatos" key="metadata">
              <div style={{ padding: '16px', overflowY: 'auto', height: 'calc(100vh - 140px)' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title={<Title level={5}>Información del Archivo</Title>}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text strong>Título: </Text>
                        <Text>{extractedData.metadata.title || 'No disponible'}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>Autor: </Text>
                        <Text>{extractedData.metadata.author || 'No disponible'}</Text>
                      </Col>
                      <Col span={8}>
                        <Text strong>Tipo: </Text>
                        <Text>{extractedData.metadata.fileType || 'N/A'}</Text>
                      </Col>
                      <Col span={8}>
                        <Text strong>Tamaño: </Text>
                        <Text>{extractedData.metadata.size ? `${(extractedData.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</Text>
                      </Col>
                      <Col span={8}>
                        <Text strong>Fecha: </Text>
                        <Text>{extractedData.metadata.uploadDate || 'N/A'}</Text>
                      </Col>
                    </Row>
                  </Card>

                  <Card title={<Title level={5}>Estadísticas de Procesamiento</Title>}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic 
                          title="Total de Chunks" 
                          value={extractedData.statistics.chunkCount} 
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Contenido Total (chars)" 
                          value={extractedData.statistics.totalContentLength || 0}
                          formatter={value => value.toLocaleString()} 
                        />
                      </Col>
                    </Row>
                    
                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={8}>
                        <Statistic 
                          title="Chunk Promedio" 
                          value={extractedData.statistics.averageChunkSize || 0}
                          formatter={value => value.toLocaleString()} 
                          suffix="chars"
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic 
                          title="Chunk Mínimo" 
                          value={extractedData.statistics.minChunkSize || 0}
                          formatter={value => value.toLocaleString()} 
                          suffix="chars"
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic 
                          title="Chunk Máximo" 
                          value={extractedData.statistics.maxChunkSize || 0}
                          formatter={value => value.toLocaleString()} 
                          suffix="chars"
                        />
                      </Col>
                    </Row>

                    {/* Distribución visual de tamaños */}
                    <Row style={{ marginTop: 24 }}>
                      <Col span={24}>
                        <Title level={5} style={{ fontSize: '14px', marginBottom: 8 }}>
                          Distribución de Tamaños
                        </Title>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: '12px', minWidth: 60 }}>Mínimo</Text>
                          <Progress 
                            percent={extractedData.statistics.minChunkSize && extractedData.statistics.maxChunkSize 
                              ? Math.round((extractedData.statistics.minChunkSize / extractedData.statistics.maxChunkSize) * 100)
                              : 0
                            }
                            size="small"
                            strokeColor="#ff4d4f"
                            style={{ flex: 1 }}
                            format={() => `${extractedData.statistics.minChunkSize || 0}`}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text style={{ fontSize: '12px', minWidth: 60 }}>Promedio</Text>
                          <Progress 
                            percent={extractedData.statistics.averageChunkSize && extractedData.statistics.maxChunkSize
                              ? Math.round((extractedData.statistics.averageChunkSize / extractedData.statistics.maxChunkSize) * 100)
                              : 0
                            }
                            size="small"
                            strokeColor="#1890ff"
                            style={{ flex: 1 }}
                            format={() => `${Math.round(extractedData.statistics.averageChunkSize || 0)}`}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text style={{ fontSize: '12px', minWidth: 60 }}>Máximo</Text>
                          <Progress 
                            percent={100}
                            size="small"
                            strokeColor="#52c41a"
                            style={{ flex: 1 }}
                            format={() => `${extractedData.statistics.maxChunkSize || 0}`}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              </div>
            </TabPane>

            <TabPane tab={`Chunks (${extractedData.chunks.length})`} key="chunks">
              <div style={{ padding: '16px', overflowY: 'auto', height: 'calc(100vh - 140px)' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Header con controles de filtros y acciones */}
                  <Card size="small">
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} sm={24} md={8}>
                        <Input
                          placeholder="Buscar en chunks..."
                          prefix={<SearchOutlined />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          allowClear
                        />
                      </Col>
                      <Col xs={12} sm={12} md={6}>
                        <Select
                          style={{ width: '100%' }}
                          placeholder="Filtrar por tipo"
                          value={chunkTypeFilter}
                          onChange={setChunkTypeFilter}
                          suffixIcon={<FilterOutlined />}
                        >
                          <Select.Option value="all">Todos los tipos</Select.Option>
                          {chunkTypes.map(type => (
                            <Select.Option key={type} value={type}>
                              {type}
                            </Select.Option>
                          ))}
                        </Select>
                      </Col>
                      <Col xs={12} sm={12} md={10}>
                        <Space wrap>
                          <Button 
                            type="default"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(
                              extractedData.chunks.map(c => c.content).join('\n\n'),
                              'Texto completo'
                            )}
                            size="small"
                          >
                            Copiar Todo
                          </Button>
                          <Button 
                            type="default"
                            icon={<DownloadOutlined />}
                            onClick={handleExportText}
                            size="small"
                          >
                            Exportar
                          </Button>
                          <Button 
                            type="primary"
                            icon={<SyncOutlined spin={isLoading} />}
                            onClick={handleGenerateEmbeddings}
                            loading={isLoading}
                            size="small"
                          >
                            Embeddings
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                    
                    {/* Estadísticas de filtrado */}
                    {(searchTerm || chunkTypeFilter !== 'all') && (
                      <Row style={{ marginTop: 12 }}>
                        <Col span={24}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Mostrando {filteredChunks.length} de {extractedData.chunks.length} chunks
                            {searchTerm && ` | Búsqueda: "${searchTerm}"`}
                            {chunkTypeFilter !== 'all' && ` | Tipo: ${chunkTypeFilter}`}
                          </Text>
                        </Col>
                      </Row>
                    )}
                  </Card>

                  {/* Lista de chunks */}
                  {filteredChunks.length === 0 ? (
                    <Empty 
                      description="No se encontraron chunks con los filtros aplicados"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {paginatedChunks.map((chunk) => (
                        <Card 
                          key={chunk.id}
                          size="small"
                          style={{ backgroundColor: isDark ? token.colorBgElevated : '#fafafa' }}
                          extra={
                            <Tooltip title="Copiar chunk">
                              <Button 
                                type="text" 
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(chunk.content, 'Chunk')}
                              />
                            </Tooltip>
                          }
                        >
                          <Space style={{ marginBottom: 8 }} wrap>
                            <Tag color="blue">{`Chunk ${chunk.chunkIndex + 1}`}</Tag>
                            <Tag color="cyan">{chunk.type}</Tag>
                            <Tag color="purple">{`${chunk.contentLength} chars`}</Tag>
                            {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                              <Tag color="green">Con metadata</Tag>
                            )}
                            <Tag color="geekblue">
                              {new Date(chunk.createdAt).toLocaleDateString()}
                            </Tag>
                          </Space>
                          <div style={{
                            backgroundColor: isDark ? token.colorBgContainer : 'white',
                            padding: 16,
                            borderRadius: 4,
                            border: `1px solid ${isDark ? token.colorBorder : '#f0f0f0'}`,
                            maxHeight: 200,
                            overflowY: 'auto'
                          }}>
                            <Paragraph
                              style={{
                                whiteSpace: 'pre-wrap',
                                margin: 0,
                                fontSize: '13px'
                              }}
                            >
                              {chunk.content}
                            </Paragraph>
                          </div>
                        </Card>
                      ))}
                      
                      {/* Paginación */}
                      {filteredChunks.length > pageSize && (
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Pagination
                            current={currentPage}
                            total={filteredChunks.length}
                            pageSize={pageSize}
                            onChange={setCurrentPage}
                            onShowSizeChange={(_, size) => {
                              setPageSize(size);
                              setCurrentPage(1);
                            }}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total, range) => 
                              `${range[0]}-${range[1]} de ${total} chunks`
                            }
                            pageSizeOptions={['5', '10', '20', '50']}
                            size="small"
                          />
                        </Card>
                      )}
                    </Space>
                  )}
                </Space>
              </div>
            </TabPane>
          </Tabs>
        )}

        {!document && !isLoading && !error && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#999999',
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <Space direction="vertical">
              <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Text style={{ fontSize: '16px' }}>Selecciona un documento para ver sus datos</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Usa el botón "Datos" en la tabla de documentos
              </Text>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};
