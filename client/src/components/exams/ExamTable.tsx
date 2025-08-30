import { Button, Table, Tag, Tooltip, Typography, Space, theme } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useExamsStore, type ExamSummary, type ExamsState } from '../../store/examsStore';

const { Text } = Typography;

type Props = {
  data: ExamSummary[];
  onView?: (exam: ExamSummary) => void;
  onEdit?: (exam: ExamSummary) => void;
};

function fmt(dateIso?: string) {
  if (!dateIso) return '—';
  try {
    return new Date(dateIso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
}

function StatusVisibility({ exam }: { exam: ExamSummary }) {
  const isHidden = exam.visibility === 'hidden';

  if (isHidden) {
    return (
      <div>
        <Tag color="error">Oculto</Tag>
        <div className="text-[12px] text-[var(--ant-color-text-tertiary)]">
          No visible al alumnado
        </div>
      </div>
    );
  }

  if (exam.status === 'published') {
    return (
      <div>
        <Tag color="success">Publicado</Tag>
        <div className="text-[12px] text-[var(--ant-color-text-tertiary)]">
          Visible • Publicado: {fmt(exam.publishedAt)}
        </div>
      </div>
    );
  }

  if (exam.status === 'scheduled') {
    return (
      <div>
        <Tag color="processing">Programado</Tag>
        <div className="text-[12px] text-[var(--ant-color-text-tertiary)]">
          Visible • Programado para: {fmt(exam.publishedAt)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Tag color="default">Borrador</Tag>
      <div className="text-[12px] text-[var(--ant-color-text-tertiary)]">
        Visible • Aún no publicado
      </div>
    </div>
  );
}

export default function ExamTable({ data, onView, onEdit }: Props) {
  const toggleVisibility = useExamsStore((s: ExamsState) => s.toggleVisibility);
  const { token } = theme.useToken();

  const columns: ColumnsType<ExamSummary> = [
    {
      title: 'Título de Examen',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div className="min-w-[260px]">
          <Text strong style={{ color: token.colorPrimary }}>{title}</Text>
          <div className="text-[12px] text-[var(--ant-color-text-tertiary)]">
            {record.totalQuestions} preguntas • Creado: {fmt(record.createdAt)}
          </div>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Estado / Visibilidad',
      key: 'status_visibility',
      width: 320,
      render: (_, record) => <StatusVisibility exam={record} />,
      sorter: (a, b) => {
        const v = a.visibility.localeCompare(b.visibility);
        if (v !== 0) return v;
        return a.status.localeCompare(b.status);
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver">
            <Button icon={<EyeOutlined />} onClick={() => onView?.(record)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => onEdit?.(record)} />
          </Tooltip>
          <Tooltip title={record.visibility === 'visible' ? 'Ocultar' : 'Publicar'}>
            <Button
              icon={record.visibility === 'visible' ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => toggleVisibility(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      className="shadow-sm rounded-lg"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 8, showSizeChanger: false }}
    />
  );
}
