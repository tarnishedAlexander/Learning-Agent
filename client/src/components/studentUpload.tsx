import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;

interface StudentUploadProps {
  onStudentsParsed: (students: {
    nombres: string;
    apellidos: string;
    codigo: number;
  }[]) => void;
  disabled: boolean;
}

export const StudentUpload = ({ onStudentsParsed, disabled }: StudentUploadProps) => {
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xls,.xlsx',
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const parsed = json.map((row: any) => ({
          nombres: row.NOMBRES,
          apellidos: row.APELLIDOS,
          codigo: Number(row.CÓDIGO),
          asistencia: 0,
          '1er_parcial': 0,
          '2do_parcial': 0,
          final: 0
        }));

        onStudentsParsed(parsed);
      };

      reader.readAsArrayBuffer(file);
      return false; // prevent default upload
    },
    disabled,
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Arrastra tu archivo Excel aquí o haz clic para seleccionarlo</p>
      <p className="ant-upload-hint">Solo se aceptan archivos .xls/.xlsx. Deben contener NOMBRES, APELLIDOS, CÓDIGO.</p>
    </Dragger>
  );
};
