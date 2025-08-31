import { useEffect, useState } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import PageTemplate from '../../components/PageTemplate';
import AiResults from './AiResults';
import { generateQuestions, type GeneratedQuestion } from '../../services/exams.service';

const { Title } = Typography;

export default function AiQuestionsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [meta] = useState({ subject: 'Tema general', difficulty: 'medio' });

  useEffect(() => {
    // puedes precargar preguntas aquí si lo deseas
  }, []);

  const onChangeQuestion = (q: GeneratedQuestion) => {
    setQuestions(prev => prev.map(x => (x.id === q.id ? q : x)));
  };

  const onRegenerateAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        subject: meta.subject,
        difficulty: meta.difficulty,
        totalQuestions: 3,
        language: 'es',
        distribution: {
          multiple_choice: 1,
          true_false: 1,
          open_analysis: 1,
          open_exercise: 0,
        },
      };
      const list = await generateQuestions(payload as any);
      setQuestions(list);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron regenerar preguntas.');
    } finally {
      setLoading(false);
    }
  };

  const onRegenerateOne = async (q: GeneratedQuestion) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        subject: meta.subject,
        difficulty: meta.difficulty,
        totalQuestions: 1,
        language: 'es',
        distribution: {
          multiple_choice: q.type === 'multiple_choice' ? 1 : 0,
          true_false: q.type === 'true_false' ? 1 : 0,
          open_analysis: q.type === 'open_analysis' ? 1 : 0,
          open_exercise: q.type === 'open_exercise' ? 1 : 0,
        },
      };
      const [one] = await generateQuestions(payload as any);
      if (one) {
        setQuestions(prev =>
          prev.map(x =>
            x.id === q.id ? { ...one, id: q.id, include: q.include } : x
          )
        );
      }
    } catch (e: any) {
      setError(e?.message || 'No se pudo regenerar la pregunta.');
    } finally {
      setLoading(false);
    }
  };

  const onAddManual = (type: GeneratedQuestion['type']) => {
    const id = `manual_${Date.now()}`;
    if (type === 'multiple_choice') {
      setQuestions(prev => [
        ...prev,
        {
          id,
          type,
          text: 'Escribe aquí tu pregunta de opción múltiple…',
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          include: true,
        } as GeneratedQuestion,
      ]);
    } else if (type === 'true_false') {
      setQuestions(prev => [
        ...prev,
        {
          id,
          type,
          text: 'Enuncia aquí tu afirmación para Verdadero/Falso…',
          include: true,
        } as GeneratedQuestion,
      ]);
    } else if (type === 'open_exercise') {
      setQuestions(prev => [
        ...prev,
        {
          id,
          type,
          text: 'Describe aquí el enunciado del ejercicio abierto…',
          include: true,
        } as GeneratedQuestion,
      ]);
    } else {
      setQuestions(prev => [
        ...prev,
        {
          id,
          type,
          text: 'Escribe aquí tu consigna de análisis abierto…',
          include: true,
        } as GeneratedQuestion,
      ]);
    }
  };

  const onSave = async () => {
    const totalIncluidas = questions.filter(q => q.include).length;
    alert(`Guardado (simulado). Preguntas incluidas: ${totalIncluidas}`);
  };

  // NUEVO: handler requerido por AiResults
  const onReorder = (from: number, to: number) => {
    setQuestions(prev => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= prev.length ||
        to >= prev.length
      )
        return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <PageTemplate title="Preguntas IA">
      <Space
        className="w-full mb-4"
        align="center"
        style={{ justifyContent: 'space-between' }}
      >
        <Title level={4} className="!mb-0">
          Panel de Preguntas Generadas
        </Title>
        <Space>
          <Button onClick={onRegenerateAll}>Regenerar</Button>
          <Button type="primary" onClick={onSave}>
            Guardar y Finalizar
          </Button>
        </Space>
      </Space>

      {error && <Alert className="mb-4" type="error" showIcon message={error} />}

      <AiResults
        subject={meta.subject}
        difficulty={meta.difficulty}
        createdAt={new Date().toLocaleDateString()}
        questions={questions}
        loading={loading}
        error={error}
        onChange={onChangeQuestion}
        onRegenerateAll={onRegenerateAll}
        onRegenerateOne={onRegenerateOne}
        onAddManual={onAddManual}
        onSave={onSave}
        onReorder={onReorder} // <- agregado para corregir TS2741
      />
    </PageTemplate>
  );
}
