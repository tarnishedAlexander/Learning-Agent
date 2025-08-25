import { Modal, Table, Alert, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

type RowIn = Record<string, any> & {
  nombres: string;
  apellidos: string;
  codigo: number | string;
};

type Props = {
  open: boolean;
  data: RowIn[];
  duplicates: string[];
  meta: { fileName: string; totalRows: number };
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function StudentPreviewModal({
  open, data, duplicates, meta, loading, onCancel, onConfirm,
}: Props) {
  const dupSet = new Set(duplicates.map((d) => String(d).trim().toLowerCase()));

  const hasCorreo = data.some((r) => 'correo' in r && String(r.correo || '').trim() !== '');

  const coreKeys = new Set(['nombres', 'apellidos', 'codigo', 'correo']);
  const extraCols = Array.from(
    data.reduce<Set<string>>((acc, row) => {
      Object.keys(row).forEach((k) => {
        const nk = k.trim();
        if (!coreKeys.has(nk)) acc.add(nk);
      });
      return acc;
    }, new Set<string>())
  );

  const columns: ColumnsType<RowIn> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (v: any) =>
        dupSet.has(String(v || '').trim().toLowerCase())
          ? <Text type="danger">{String(v)} (duplicado)</Text>
          : <Text>{String(v)}</Text>,
      width: 160,
    },
    { title: 'Nombre', dataIndex: 'nombres', key: 'nombres' },
    { title: 'Apellido', dataIndex: 'apellidos', key: 'apellidos' },
    ...(hasCorreo ? [{ title: 'Correo', dataIndex: 'correo', key: 'correo' } as const] : []),
    ...extraCols.map((k) => ({
      title: k,
      dataIndex: k,
      key: k,
    })),
  ];

  return (
    <Modal
      centered
      open={open}
      title="Previsualización de estudiantes"
      okText="Confirmar envío"
      cancelText="Cancelar"
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      width={900}
    >
      <div className="space-y-3">
        <Alert
          type="info"
          showIcon
          message={
            <div className="flex flex-col gap-1">
              <span><b>Archivo:</b> {meta.fileName}</span>
              <span><b>Filas detectadas:</b> {meta.totalRows}</span>
              {duplicates.length > 0 && (
                <span><b>Duplicados locales:</b> <Text type="danger">{duplicates.join(', ')}</Text></span>
              )}
              <span>
                Al confirmar, los estudiantes se inscribirán en el curso.<br />
                Los duplicados por código solo se registrarán una vez.
              </span>
            </div>
          }
        />
        <Table
          size="small"
          rowKey={(_, i) => String(i)}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </div>
    </Modal>
  );
}