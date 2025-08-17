import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface DocumentUploadProps {
  onUploadSuccess: (file: File) => void;
}

export const DocumentUpload = ({ onUploadSuccess }: DocumentUploadProps) => {
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    showUploadList: false,
    beforeUpload: async (file) => {
      // Validar tamaño del archivo (10MB)
      const isLessThan10MB = file.size / 1024 / 1024 < 10;
      if (!isLessThan10MB) {
        message.error('El archivo debe ser menor a 10MB');
        return false;
      }

      try {
        onUploadSuccess(file);
        message.success('Documento subido exitosamente');
      } catch (error) {
        message.error('Error al subir el documento');
      }

      return false; // Prevent default upload behavior
    },
  };

  return (
    <Dragger {...props} style={{ 
      backgroundColor: '#F8F9FA',
      borderRadius: '8px',
      border: '2px dashed #7A85C1',
      marginBottom: '20px'
    }}>
      <p className="ant-upload-drag-icon" style={{ color: '#1A2A80' }}>
        <InboxOutlined />
      </p>
      <p className="ant-upload-text" style={{ color: '#3B38A0' }}>
        Arrastra tu archivo PDF aquí o haz clic para seleccionarlo
      </p>
      <p className="ant-upload-hint" style={{ color: '#7A85C1' }}>
        Solo se aceptan archivos PDF menores a 10MB
      </p>
    </Dragger>
  );
};
