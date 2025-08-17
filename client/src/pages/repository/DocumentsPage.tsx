import { Space } from 'antd';
import { DocumentTable } from '../../components/documents/DocumentTable';
import { useDocuments } from '../../hooks/useDocuments';

export function DocumentsPage() {
  const { documents, loading } = useDocuments();

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <h1 style={{ color: '#1A2A80' }}>Documentos del Curso</h1>
        
        <DocumentTable 
          documents={documents} 
          loading={loading}
          onDelete={() => {}} // Deshabilitado - será implementado por otro desarrollador
        />
      </Space>
    </div>
  );
}
