import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Drawer,
  Grid,
  theme as antTheme
} from 'antd';
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
import { useThemeStore } from '../../store/themeStore';
import { palette } from '../../theme';
import type { Document, DocumentExtractedData } from '../../interfaces/documentInterface';
import { useDocuments } from '../../hooks/useDocuments';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

// Constants
const MIN_DRAWER_HEIGHT = 220;
const MAX_DRAWER_HEIGHT_RATIO = 0.98;
const INITIAL_DRAWER_HEIGHT_RATIO = 0.75;
const DEFAULT_PAGE_SIZE = 5;
const MAX_SEARCH_DISPLAY_LENGTH = 15;

interface DocumentDataSidebarProps {
  document: Document | null;
  onClose: () => void;
  visible: boolean;
}

export const DocumentDataSidebar: React.FC<DocumentDataSidebarProps> = ({ document, onClose, visible }) => {
  const { getDocumentExtractedData, generateDocumentEmbeddings, getDocumentIndex, generateDocumentIndex, extractedDataLoading, extractedDataError } = useDocuments();

  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === 'dark';
  const { token } = antTheme.useToken();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // bottom-sheet (mobile)
  const initialHeight = Math.round(window.innerHeight * INITIAL_DRAWER_HEIGHT_RATIO);
  const [drawerHeight, setDrawerHeight] = useState<number>(initialHeight);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(drawerHeight);

  // extracted data state
  const [extractedData, setExtractedData] = useState<DocumentExtractedData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('metadata');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [chunkTypeFilter, setChunkTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [retryCount, setRetryCount] = useState<number>(0);

  // index state
  const [indexData, setIndexData] = useState<any>(null);
  const [indexLoading, setIndexLoading] = useState<boolean>(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const documentId = document?.id;
  const isLoading = documentId ? extractedDataLoading[documentId] || false : false;
  const error = documentId ? extractedDataError[documentId] || null : null;

  const loadExtractedData = useCallback(async () => {
    if (!document?.id) {
      setExtractedData(null);
      return;
    }
    try {
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
    } catch (err) {
      console.error('Error loading extracted data:', err);
    }
  }, [document?.id, getDocumentExtractedData]);

  // Index functions
  const loadIndexData = useCallback(async () => {
    if (!document?.id) {
      console.log('No document ID, setting indexData to null');
      setIndexData(null);
      return;
    }
    
    console.log('Loading index data for document:', document.id);
    setIndexLoading(true);
    setIndexError(null);
    
    try {
      const data = await getDocumentIndex(document.id);
      console.log('Index data loaded:', data);
      
      // Verificar si la respuesta es exitosa
      if (!data.success) {
        throw new Error(data.message || 'Error desconocido al cargar el índice');
      }
      
      setIndexData(data);
      
    } catch (err: any) {
      console.error('Error loading index data:', err);
      
      // Determinar el mensaje de error más específico
      let errorMessage = 'Error al cargar el índice';
      
      if (err?.response?.status === 404) {
        // Si es 404, probablemente no existe índice aún
        console.log('Index not found, this is normal for documents without generated index');
        setIndexData(null);
        setIndexError(null);
        return;
      } else if (err?.response?.status === 400) {
        errorMessage = 'Documento no válido';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setIndexError(errorMessage);
      
    } finally {
      setIndexLoading(false);
    }
  }, [document?.id, getDocumentIndex]);

  const handleGenerateIndex = useCallback(async () => {
    if (!document?.id) {
      message.error('No se ha seleccionado un documento');
      return;
    }
    
    setIndexLoading(true);
    setIndexError(null);
    
    // Mostrar mensaje de progreso
    message.info('Generando índice del documento... Esto puede tomar unos minutos.');
    
    try {
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: La generación del índice está tomando demasiado tiempo')), 120000) // 2 minutos
      );
      
      const generatePromise = generateDocumentIndex(document.id);
      
      // Ejecutar con timeout
      const generateResult = await Promise.race([generatePromise, timeoutPromise]) as any;
      console.log('Generate result:', generateResult);
      
      // Verificar si la generación fue exitosa
      if (!generateResult?.success) {
        throw new Error(generateResult?.message || 'Error desconocido al generar el índice');
      }
      
      // Recargar datos del índice después de generar
      await loadIndexData();
      message.success('Índice generado exitosamente');
      
    } catch (err: any) {
      console.error('Error generating index:', err);
      
      // Determinar el mensaje de error más específico
      let errorMessage = 'Error al generar el índice';
      
      if (err?.message?.includes('Timeout')) {
        errorMessage = 'La generación del índice está tomando demasiado tiempo. Inténtalo más tarde.';
      } else if (err?.response?.status === 400) {
        errorMessage = 'El documento no es válido para generar índice';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Documento no encontrado';
      } else if (err?.response?.status === 409) {
        errorMessage = 'Ya hay una generación de índice en proceso';
      } else if (err?.response?.status === 422) {
        errorMessage = 'El documento no tiene suficiente contenido para generar un índice';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Error interno del servidor al generar el índice';
      } else if (err?.response?.status === 503) {
        errorMessage = 'Servicio temporalmente no disponible';
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setIndexError(errorMessage);
      message.error(errorMessage);
      
    } finally {
      setIndexLoading(false);
    }
  }, [document?.id, generateDocumentIndex, loadIndexData]);

  // Función para procesar los chapters en elementos planos
  const processFlatIndex = useCallback((chapters: any[]) => {
    const flatItems: any[] = [];
    
    chapters.forEach((chapter, chapterIndex) => {
      // Agregar el capítulo principal
      flatItems.push({
        id: `chapter-${chapterIndex}`,
        title: chapter.title,
        description: chapter.description,
        level: 1,
        type: 'chapter'
      });
      
      // Agregar subtemas
      if (chapter.subtopics && chapter.subtopics.length > 0) {
        chapter.subtopics.forEach((subtopic: any, subtopicIndex: number) => {
          flatItems.push({
            id: `subtopic-${chapterIndex}-${subtopicIndex}`,
            title: subtopic.title,
            description: subtopic.description,
            level: 2,
            type: 'subtopic'
          });
        });
      }
      
      // Agregar ejercicios
      if (chapter.exercises && chapter.exercises.length > 0) {
        chapter.exercises.forEach((exercise: any, exerciseIndex: number) => {
          flatItems.push({
            id: `exercise-${chapterIndex}-${exerciseIndex}`,
            title: exercise.title,
            description: exercise.description,
            difficulty: exercise.difficulty,
            estimatedTime: exercise.estimatedTime,
            keywords: exercise.keywords,
            level: 3,
            type: exercise.type || 'exercise'
          });
        });
      }
    });
    
    return flatItems;
  }, []);

  useEffect(() => {
    if (document?.id && visible) {
      loadExtractedData();
      // Siempre cargar datos del índice cuando se cambie a esa pestaña
      if (activeTab === 'index') {
        console.log('Changing to index tab, loading index data...');
        loadIndexData();
      }
    } else {
      setExtractedData(null);
      setIndexData(null);
      setSearchTerm('');
      setChunkTypeFilter('all');
      setCurrentPage(1);
      setIndexError(null);
    }
  }, [document?.id, visible, activeTab, loadExtractedData, loadIndexData]);

  // copy to clipboard util
  const copyToClipboard = useCallback(async (text: string, label = 'Texto') => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label} copiado al portapapeles`);
    } catch {
      message.error('Error al copiar al portapapeles');
    }
  }, []);

  const retryLoadData = useCallback(async () => {
    if (!document?.id) return;
    setRetryCount((p) => p + 1);
    try {
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
      message.success('Datos recargados exitosamente');
    } catch (err) {
      console.error('Error reloading data:', err);
      message.error('Error al recargar los datos');
    }
  }, [document?.id, getDocumentExtractedData]);

  // filtering + pagination
  const filteredChunks = useMemo(() => {
    if (!extractedData?.chunks) return [];
    const q = searchTerm.trim().toLowerCase();
    return extractedData.chunks.filter((chunk) => {
      const matchQ = !q || chunk.content.toLowerCase().includes(q);
      const matchType = chunkTypeFilter === 'all' || chunk.type === chunkTypeFilter;
      return matchQ && matchType;
    });
  }, [extractedData?.chunks, searchTerm, chunkTypeFilter]);

  useEffect(() => setCurrentPage(1), [searchTerm, chunkTypeFilter]);

  const paginatedChunks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChunks.slice(start, start + pageSize);
  }, [filteredChunks, currentPage, pageSize]);

  const chunkTypes = useMemo(() => (extractedData?.chunks ? Array.from(new Set(extractedData.chunks.map((c) => c.type))) : []), [extractedData?.chunks]);

  const handleGenerateEmbeddings = useCallback(async () => {
    if (!document?.id) return;
    try {
      await generateDocumentEmbeddings(document.id);
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
      message.success('Embeddings generados');
    } catch (err) {
      console.error('Error generating embeddings:', err);
      message.error('Error al generar embeddings');
    }
  }, [document?.id, generateDocumentEmbeddings, getDocumentExtractedData]);

  const handleExportText = useCallback(() => {
    if (!extractedData) return;
    const txt = extractedData.chunks.map((c) => c.content).join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${extractedData.metadata.title || extractedData.metadata.fileName || 'documento'}_extraido.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [extractedData]);

  // helper
  const ActionButtons = () => {
    const btnSize = isMobile ? 'small' : 'small';

    return (
      <>
        <Tooltip title="Copiar todo el texto">
          <Button
            type="default"
            icon={<CopyOutlined />}
            onClick={() => extractedData && copyToClipboard(extractedData.chunks.map((c) => c.content).join('\n\n'), 'Texto completo')}
            size={btnSize}
            aria-label="Copiar todo"
          >
            Copiar Todo
          </Button>
        </Tooltip>

        <Tooltip 
          title="Exportar texto"
          placement={isMobile ? "topLeft" : "top"}
          getPopupContainer={(trigger) => trigger?.parentElement || window.document.body}
          overlayStyle={{ 
            maxWidth: isMobile ? '100px' : '140px',
            fontSize: isMobile ? '12px' : '14px',
            whiteSpace: 'nowrap'
          }}
          overlayInnerStyle={{
            textAlign: 'center',
            padding: isMobile ? '4px 8px' : '6px 12px'
          }}
        >
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExportText}
            size={btnSize}
            aria-label="Exportar"
          >
            Exportar
          </Button>
        </Tooltip>

        <Tooltip 
          title="Generar embeddings para búsqueda semántica"
          placement={isMobile ? "topRight" : "top"}
          getPopupContainer={(trigger) => trigger?.parentElement || window.document.body}
          overlayStyle={{ 
            maxWidth: isMobile ? '200px' : '300px',
            fontSize: isMobile ? '12px' : '14px'
          }}
        >
          <Button
            type="primary"
            icon={<SyncOutlined spin={isLoading} />}
            onClick={handleGenerateEmbeddings}
            loading={isLoading}
            size={btnSize}
            aria-label="Generar embeddings"
          >
            Embeddings
          </Button>
        </Tooltip>
      </>
    );
  };


  useEffect(() => {
    const onResize = () => {
      const newMax = Math.round(window.innerHeight * MAX_DRAWER_HEIGHT_RATIO);
      setDrawerHeight((h) => Math.max(MIN_DRAWER_HEIGHT, Math.min(newMax, h)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = drawerHeight;
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = startYRef.current - ev.clientY; 
      const candidate = Math.round(startHeightRef.current + delta);
      const bounded = Math.max(MIN_DRAWER_HEIGHT, Math.min(Math.round(window.innerHeight * MAX_DRAWER_HEIGHT_RATIO), candidate));
      setDrawerHeight(bounded);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [drawerHeight]);

  // ui
  const Header = (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgElevated,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <FileTextOutlined style={{ color: isDark ? token.colorPrimary : palette.P0, fontSize: 18, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <Title level={5} style={{ margin: 0, color: isDark ? token.colorPrimary : palette.P0 }}>
            Datos del Documento
          </Title>
          {document && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', maxWidth: isMobile ? 200 : 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {document.originalName}
            </Text>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ color: token.colorTextSecondary, fontSize: 16, padding: 6 }} />
      </div>
    </div>
  );

  const Body = (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 16, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {isLoading && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card><Skeleton active paragraph={{ rows: 3 }} /></Card>
            <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
            <Card>
              <Skeleton.Button active style={{ width: 200, height: 40 }} />
              <Skeleton active paragraph={{ rows: 4, style: { marginTop: 16 } }} />
            </Card>
          </Space>
        )}

        {error && (
          <Alert
            message="Error al cargar datos"
            description={<Space direction="vertical" style={{ width: '100%' }}><Text>{error}</Text>{retryCount > 0 && <Text type="secondary">Intentos de recarga: {retryCount}</Text>}</Space>}
            type="error"
            showIcon
            action={<Button size="small" icon={<ReloadOutlined />} onClick={retryLoadData} loading={isLoading}>Reintentar</Button>}
            style={{ marginBottom: 16 }}
          />
        )}

        {extractedData && !isLoading && !error && (
          <>
            <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarStyle={{ padding: 0, marginBottom: 8 }}>
              <TabPane tab="Metadatos" key="metadata">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title={<Title level={5}>Información del Archivo</Title>}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}><Text strong>Título: </Text><Text>{extractedData.metadata.title || 'No disponible'}</Text></Col>
                      <Col span={12}><Text strong>Autor: </Text><Text>{extractedData.metadata.author || 'No disponible'}</Text></Col>
                      <Col span={8}><Text strong>Tipo: </Text><Text>{extractedData.metadata.fileType || 'N/A'}</Text></Col>
                      <Col span={8}><Text strong>Tamaño: </Text><Text>{extractedData.metadata.size ? `${(extractedData.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</Text></Col>
                      <Col span={8}><Text strong>Fecha: </Text><Text>{extractedData.metadata.uploadDate || 'N/A'}</Text></Col>
                    </Row>
                  </Card>

                  <Card title={<Title level={5}>Estadísticas de Procesamiento</Title>}>
                    <Row gutter={16}>
                      <Col span={12}><Statistic title="Total de Chunks" value={extractedData.statistics.chunkCount} /></Col>
                      <Col span={12}><Statistic title="Contenido Total (chars)" value={extractedData.statistics.totalContentLength || 0} formatter={(v) => (v as number).toLocaleString()} /></Col>
                    </Row>

                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={8}><Statistic title="Chunk Promedio" value={extractedData.statistics.averageChunkSize || 0} formatter={(v) => (v as number).toLocaleString()} suffix="chars" /></Col>
                      <Col span={8}><Statistic title="Chunk Mínimo" value={extractedData.statistics.minChunkSize || 0} formatter={(v) => (v as number).toLocaleString()} suffix="chars" /></Col>
                      <Col span={8}><Statistic title="Chunk Máximo" value={extractedData.statistics.maxChunkSize || 0} formatter={(v) => (v as number).toLocaleString()} suffix="chars" /></Col>
                    </Row>

                    <div style={{ marginTop: 24 }}>
                      <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Distribución de Tamaños</Title>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, minWidth: 60 }}>Mínimo</Text>
                        <Progress percent={extractedData.statistics.minChunkSize && extractedData.statistics.maxChunkSize ? Math.round((extractedData.statistics.minChunkSize / extractedData.statistics.maxChunkSize) * 100) : 0} size="small" strokeColor={token.colorError} style={{ flex: 1 }} format={() => `${extractedData.statistics.minChunkSize || 0}`} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={{ fontSize: 12, minWidth: 60 }}>Promedio</Text>
                        <Progress percent={extractedData.statistics.averageChunkSize && extractedData.statistics.maxChunkSize ? Math.round((extractedData.statistics.averageChunkSize / extractedData.statistics.maxChunkSize) * 100) : 0} size="small" strokeColor={token.colorInfo} style={{ flex: 1 }} format={() => `${Math.round(extractedData.statistics.averageChunkSize || 0)}`} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={{ fontSize: 12, minWidth: 60 }}>Máximo</Text>
                        <Progress percent={100} size="small" strokeColor={token.colorSuccess} style={{ flex: 1 }} format={() => `${extractedData.statistics.maxChunkSize || 0}`} />
                      </div>
                    </div>
                  </Card>
                </Space>
              </TabPane>

              <TabPane tab={`Chunks (${extractedData.chunks.length})`} key="chunks">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card size="small">
                    <Row gutter={[8, 12]} align="middle">
                      <Col xs={24} sm={24} md={24} lg={12} xl={10}>
                        <Input placeholder="Buscar contenido..." prefix={<SearchOutlined />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} allowClear size={isMobile ? "small" : undefined} />
                      </Col>

                      <Col xs={12} sm={8} md={8} lg={6} xl={5}>
                        <Select style={{ width: '100%' }} placeholder="Filtrar tipo" value={chunkTypeFilter} onChange={setChunkTypeFilter} suffixIcon={<FilterOutlined />} size={isMobile ? "small" : undefined} popupMatchSelectWidth={false}>
                          <Select.Option value="all">Todos</Select.Option>
                          {chunkTypes.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                        </Select>
                      </Col>

                      {/* desktop lg y xl */}
                      {screens.lg && (
                        <Col xs={12} sm={16} md={16} lg={6} xl={9}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <ActionButtons />
                          </div>
                        </Col>
                      )}
                    </Row>

                    {/* small screens */}
                    {!screens.lg && (
                      <Row style={{ marginTop: 12 }}>
                        <Col span={24}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <ActionButtons />
                          </div>
                        </Col>
                      </Row>
                    )}

                    {(searchTerm || chunkTypeFilter !== 'all') && (
                      <Row style={{ marginTop: 12 }}>
                        <Col span={24}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Mostrando {filteredChunks.length} de {extractedData.chunks.length} chunks</Text>
                            {searchTerm && <Tag color="blue" style={{ fontSize: isMobile ? 12 : 14 }}>Búsqueda: "{searchTerm.length > MAX_SEARCH_DISPLAY_LENGTH ? `${searchTerm.substring(0, MAX_SEARCH_DISPLAY_LENGTH)}...` : searchTerm}"</Tag>}
                            {chunkTypeFilter !== 'all' && <Tag color="green" style={{ fontSize: isMobile ? 12 : 14 }}>Tipo: {chunkTypeFilter}</Tag>}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Card>

                  {filteredChunks.length === 0 ? (
                    <Empty description="No se encontraron chunks con los filtros aplicados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <>
                      {paginatedChunks.map((chunk) => (
                        <Card key={chunk.id} size="small" style={{ backgroundColor: token.colorBgElevated }} extra={<Tooltip title="Copiar chunk"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(chunk.content, 'Chunk')} /></Tooltip>}>
                          <Space style={{ marginBottom: 8 }} wrap size="small">
                            <Tag color="blue" style={{ fontSize: isMobile ? 12 : 14 }}>{`#${chunk.chunkIndex + 1}`}</Tag>
                            <Tag color="cyan" style={{ fontSize: isMobile ? 12 : 14 }}>{chunk.type}</Tag>
                            <Tag color="purple" style={{ fontSize: isMobile ? 12 : 14 }}>{isMobile ? `${Math.round(chunk.contentLength / 100) / 10}k` : `${chunk.contentLength} chars`}</Tag>
                            {chunk.metadata && Object.keys(chunk.metadata).length > 0 && <Tag color="green" style={{ fontSize: isMobile ? 12 : 14 }}>{isMobile ? 'Meta' : 'Con metadata'}</Tag>}
                            {!isMobile && <Tag color="geekblue" style={{ fontSize: 14 }}>{new Date(chunk.createdAt).toLocaleDateString()}</Tag>}
                          </Space>

                          <div style={{ backgroundColor: token.colorBgContainer, padding: isMobile ? 12 : 16, borderRadius: 4, border: `1px solid ${token.colorBorder}`, maxHeight: isMobile ? 150 : 200, overflowY: 'auto' }}>
                            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: isMobile ? 12 : 13, lineHeight: isMobile ? '1.4' : '1.5', wordBreak: 'break-word' }}>
                              {chunk.content}
                            </Paragraph>
                          </div>
                        </Card>
                      ))}

                      {filteredChunks.length > 0 && (
                        <Card size="small" style={{ textAlign: 'center', overflow: 'hidden' }}>
                          <Pagination 
                            current={currentPage} 
                            total={filteredChunks.length} 
                            pageSize={pageSize} 
                            onChange={setCurrentPage} 
                            onShowSizeChange={(_, size) => { setPageSize(size); setCurrentPage(1); }} 
                            showSizeChanger={true} 
                            showQuickJumper={!isMobile} 
                            showTotal={(total, range) => `${range[0]}-${range[1]} de ${total}`}
                            pageSizeOptions={['5','10','20','50']} 
                            size={isMobile ? "small" : "default"} 
                            simple={false}
                            style={{ 
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          />
                        </Card>
                      )}
                    </>
                  )}
                </Space>
              </TabPane>

              <TabPane tab="Índice" key="index">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {indexLoading && (
                    <Card>
                      <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>
                  )}

                  {indexError && !indexLoading && (
                    <Alert
                      message="Error con el índice del documento"
                      description={
                        <div>
                          <p>{indexError}</p>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              • Verifica que el documento esté completamente procesado<br/>
                              • Algunos tipos de documento pueden no ser compatibles<br/>
                              • Si el problema persiste, contacta al administrador
                            </Text>
                          </div>
                        </div>
                      }
                      type="error"
                      showIcon
                      action={
                        <Space direction="vertical" size="small">
                          <Button size="small" icon={<ReloadOutlined />} onClick={loadIndexData} loading={indexLoading}>
                            Reintentar Carga
                          </Button>
                          <Button size="small" icon={<SyncOutlined />} onClick={handleGenerateIndex} loading={indexLoading}>
                            Generar Índice
                          </Button>
                        </Space>
                      }
                    />
                  )}



                  {(!indexData?.data?.chapters || indexData?.data?.chapters?.length === 0) && !indexLoading && !indexError && (
                    <Card>
                      <Empty 
                        description="No se ha generado el índice para este documento"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Button 
                          type="primary" 
                          icon={<SyncOutlined />} 
                          onClick={handleGenerateIndex}
                          loading={indexLoading}
                          size="large"
                        >
                          Generar Índice
                        </Button>
                      </div>
                    </Card>
                  )}

                  {indexData?.data?.chapters && indexData?.data?.chapters?.length > 0 && !indexLoading && (
                    <>
                      <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <Title level={5} style={{ margin: 0 }}>
                            Estructura del Documento ({indexData.data.chapters.length} capítulos)
                          </Title>
                          <Button 
                            icon={<SyncOutlined />} 
                            onClick={handleGenerateIndex}
                            loading={indexLoading}
                            size="small"
                          >
                            Regenerar
                          </Button>
                        </div>
                        
                        <Row gutter={16}>
                          <Col span={8}>
                            <Statistic 
                              title="Total de Capítulos" 
                              value={indexData.data.chapters.length} 
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic 
                              title="Generado" 
                              value={indexData.data.generatedAt ? new Date(indexData.data.generatedAt).toLocaleDateString() : 'N/A'} 
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic 
                              title="Estado" 
                              value={indexData.data.status || 'GENERATED'}
                            />
                          </Col>
                        </Row>
                      </Card>

                      <Card title={<Title level={5}>Índice de Contenidos</Title>}>
                        <div style={{ maxHeight: isMobile ? 300 : 400, overflowY: 'auto', paddingRight: 8 }}>
                          {processFlatIndex(indexData.data.chapters).map((item: any, index: number) => (
                            <div 
                              key={item.id || index}
                              style={{
                                paddingLeft: (item.level - 1) * 20,
                                marginBottom: 8,
                                borderBottom: `1px solid ${token.colorBorder}`,
                                paddingBottom: 8,
                                cursor: 'pointer',
                                borderRadius: 4,
                                padding: '8px 12px',
                                backgroundColor: token.colorBgElevated,
                                border: `1px solid ${token.colorBorder}`,
                              }}
                              onClick={() => item.description && copyToClipboard(item.description, `Contenido de ${item.type}`)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Tag color={
                                  item.type === 'chapter' ? 'blue' : 
                                  item.type === 'subtopic' ? 'green' : 
                                  item.type === 'CONCEPTUAL' ? 'orange' :
                                  item.type === 'ANALYSIS' ? 'purple' :
                                  'default'
                                }>
                                  {item.type === 'chapter' ? 'Capítulo' : 
                                   item.type === 'subtopic' ? 'Subtema' : 
                                   item.type || 'Ejercicio'}
                                </Tag>
                                <Text strong style={{ fontSize: isMobile ? 13 : 14, flex: 1 }}>
                                  {item.title}
                                </Text>
                                {item.difficulty && (
                                  <Tag color={item.difficulty === 'INTERMEDIATE' ? 'orange' : 'default'} style={{ fontSize: isMobile ? 11 : 12 }}>
                                    {item.difficulty}
                                  </Tag>
                                )}
                                {item.estimatedTime && (
                                  <Tag color="cyan" style={{ fontSize: isMobile ? 11 : 12 }}>
                                    {item.estimatedTime}
                                  </Tag>
                                )}
                                <Tooltip title="Copiar descripción">
                                  <Button 
                                    type="text" 
                                    size="small" 
                                    icon={<CopyOutlined />}
                                  />
                                </Tooltip>
                              </div>
                              
                              {item.description && (
                                <Paragraph 
                                  style={{ 
                                    marginTop: 8, 
                                    marginBottom: 0,
                                    fontSize: isMobile ? 12 : 13,
                                    color: isDark ? token.colorTextSecondary : '#666',
                                  }}
                                  ellipsis={{ 
                                    rows: 2, 
                                    expandable: true, 
                                    symbol: 'ver más' 
                                  }}
                                >
                                  {item.description}
                                </Paragraph>
                              )}
                              
                              {item.keywords && item.keywords.length > 0 && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  <Text style={{ fontSize: 12, color: isDark ? token.colorTextSecondary : '#999' }}>
                                    Palabras clave:
                                  </Text>
                                  {item.keywords.map((keyword: string, kIndex: number) => (
                                    <Tag key={kIndex} color="geekblue" style={{ fontSize: 11 }}>
                                      {keyword}
                                    </Tag>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </>
                  )}
                </Space>
              </TabPane>
            </Tabs>
          </>
        )}

        {!extractedData && !isLoading && !error && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: token.colorTextTertiary, padding: 20, textAlign: 'center' }}>
            <Space direction="vertical">
              <FileTextOutlined style={{ fontSize: 48, color: token.colorTextDisabled }} />
              <Text style={{ fontSize: 16 }}>Selecciona un documento para ver sus datos</Text>
              <Text type="secondary" style={{ fontSize: 14 }}>Usa el botón "Datos" en la tabla de documentos</Text>
            </Space>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile: bottom-sheet Drawer
  if (isMobile) {
    return (
      <Drawer
        open={visible}
        onClose={onClose}
        placement="bottom"
        height={drawerHeight}
        bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
        drawerStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '100vh' }}
        maskClosable
        closeIcon={null}
        headerStyle={{ display: 'none' }}
      >
        <div
          onPointerDown={onHandlePointerDown}
          style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 6, touchAction: 'none', cursor: 'ns-resize', userSelect: 'none' }}
        >
          <div style={{ width: 40, height: 6, borderRadius: 4, background: token.colorTextDisabled }} />
        </div>

        {Header}
        {Body}
      </Drawer>
    );
  }

  // Desktop / tablet
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        height: '100vh',
        backgroundColor: token.colorBgContainer,
        boxShadow: isDark ? '-4px 0 20px rgba(91, 110, 240, 0.1)' : '-4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${token.colorBorder}`,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: 'transform 0.28s ease-in-out, opacity 0.28s ease-in-out, visibility 0.28s ease-in-out',
      }}
    >
      {Header}
      {Body}
    </div>
  );
};
