import { useState } from 'react';
import { Card, Typography, Space, Radio, Checkbox, Button, Image, Tag, Divider, theme } from 'antd';
import { EditOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import type { RadioChangeEvent } from 'antd';
import type { GeneratedQuestion } from '../../services/exams.service';
import { palette } from '../../theme';

const { Text, Paragraph } = Typography;

export type QuestionCardProps = {
  index: number;
  question: GeneratedQuestion;
  onChange: (q: GeneratedQuestion) => void;
  onRegenerate?: (q: GeneratedQuestion) => void;
};

export default function QuestionCard({ index, question, onChange, onRegenerate }: QuestionCardProps) {
  const { token } = theme.useToken();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(question.text);
  const [selected, setSelected] = useState<string | undefined>();

  const typeLabel =
    question.type === 'multiple_choice' ? 'Selección Múltiple'
      : question.type === 'true_false' ? 'Verdadero/Falso'
      : question.type === 'open_exercise' ? 'Ejercicio'
      : 'Análisis';

  const typeAccent =
    question.type === 'multiple_choice' ? palette.P1
      : question.type === 'true_false' ? palette.P2
      : question.type === 'open_exercise' ? palette.P3
      : palette.P0;

  const handleInclude = (checked: boolean) => onChange({ ...question, include: checked });
  const handleSave = () => { setEditing(false); onChange({ ...question, text: draftText }); };
  const handleRadio = (e: RadioChangeEvent) => setSelected(e.target.value);

  return (
    <Card
      className="transition-all duration-300 hover:-translate-y-[3px] shadow-sm"
      style={{ borderLeft: `4px solid ${typeAccent}` }}
      bodyStyle={{ padding: 20 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Space size={8} align="center">
          <Tag color={palette.P0} style={{ color: '#fff', fontWeight: 600 }}>
            Pregunta {index + 1}
          </Tag>
          <Tag color={typeAccent} style={{ color: '#fff', fontWeight: 600 }}>
            {typeLabel}
          </Tag>
        </Space>

        <Space>
          {onRegenerate && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => onRegenerate(question)}
              aria-label={`Regenerar pregunta ${index + 1}`}
            >
              Regenerar
            </Button>
          )}

          {!editing ? (
            <Button
              size="small"
              type="dashed"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              aria-label={`Editar pregunta ${index + 1}`}
            >
              Editar
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              aria-label={`Guardar cambios de la pregunta ${index + 1}`}
              style={{ background: typeAccent }}
            >
              Guardar
            </Button>
          )}

          <div className="inline-flex items-center gap-2">
            <Checkbox
              checked={question.include}
              onChange={(e) => handleInclude(e.target.checked)}
              aria-label={`Incluir pregunta ${index + 1} en el examen final`}
            />
            <Text className="text-[13px]" style={{ color: token.colorTextSecondary }}>Incluir</Text>
          </div>
        </Space>
      </div>

      {!editing ? (
        <Paragraph className="mb-4 !text-[15px]">{question.text}</Paragraph>
      ) : (
        <textarea
          className="w-full min-h-[110px] p-3 rounded-md border focus:outline-none focus:ring-2"
          style={{ borderColor: token.colorBorderSecondary, outlineColor: typeAccent }}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          aria-label={`Editar texto de la pregunta ${index + 1}`}
        />
      )}

      {question.type === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0 && (
        <Radio.Group onChange={handleRadio} value={selected} className="w-full">
          <Space direction="vertical" className="w-full">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
                <Radio value={`${i}`} />
                <Text className="flex-1">{opt}</Text>
              </div>
            ))}
          </Space>
        </Radio.Group>
      )}

      {question.type === 'true_false' && (
        <Radio.Group onChange={handleRadio} value={selected} className="w-full">
          <Space direction="vertical" className="w-full">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md">
              <Radio value="V" />
              <Text className="flex-1">Verdadero</Text>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md">
              <Radio value="F" />
              <Text className="flex-1">Falso</Text>
            </div>
          </Space>
        </Radio.Group>
      )}

      {question.type === 'open_exercise' && (
        <div className="my-3 rounded-md" style={{ background: token.colorFillTertiary, borderLeft: `3px solid ${typeAccent}` }}>
          <div className="p-3">
            <Text italic style={{ color: token.colorTextSecondary }}>
              <strong>Espacio para solución:</strong> [El estudiante escribirá su respuesta aquí]
            </Text>
          </div>
        </div>
      )}

      {question.type === 'open_analysis' && 'imageUrl' in question && (question as any).imageUrl && (
        <div className="my-3 p-3 rounded-md" style={{ background: token.colorFillTertiary }}>
          <Image src={(question as any).imageUrl} alt="Recurso de análisis" />
        </div>
      )}

      <Divider style={{ marginTop: 16, marginBottom: 12 }} />
      <Space wrap>
        <Tag style={{ borderColor: 'transparent' }}>#{index + 1}</Tag>
        <Tag style={{ borderColor: 'transparent' }}>{typeLabel}</Tag>
      </Space>
    </Card>
  );
}
