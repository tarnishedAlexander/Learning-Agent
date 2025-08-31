import { Card, Typography, theme } from 'antd';
import PageTemplate from '../components/PageTemplate';
import ExamTable from '../components/exams/ExamTable';
import { useExamsStore } from '../store/examsStore';

const { Title, Text } = Typography;

export default function Exam() {
  const { token } = theme.useToken();
  const exams = useExamsStore((s) => s.exams);

  const total = exams.length;
  const published = exams.filter((e) => e.status === 'published').length;
  const scheduled = exams.filter((e) => e.status === 'scheduled').length;

  return (
    <PageTemplate
      title="Gestión de Exámenes"
      subtitle="Administra tus exámenes generados y manuales"
      user={{ name: 'Admin', role: 'Docente' }}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exámenes' },
      ]}
      actions={[]}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{ borderLeft: `4px solid ${token.colorPrimary}` }}>
            <Title level={4} style={{ margin: 0 }}>Total</Title>
            <Text type="secondary">{total} exámenes</Text>
          </Card>
          <Card style={{ borderLeft: `4px solid ${token.colorSuccess}` }}>
            <Title level={4} style={{ margin: 0 }}>Publicados</Title>
            <Text type="secondary">{published}</Text>
          </Card>
          <Card style={{ borderLeft: `4px solid ${token.colorInfo}` }}>
            <Title level={4} style={{ margin: 0 }}>Programados</Title>
            <Text type="secondary">{scheduled}</Text>
          </Card>
        </div>

        <ExamTable
          data={exams}
          onEdit={() => { window.location.href = '/exams/create'; }}
        />
      </div>
    </PageTemplate>
  );
}
