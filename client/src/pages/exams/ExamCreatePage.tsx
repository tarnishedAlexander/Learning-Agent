import { useRef, useState } from 'react';
import '../../components/exams/ExamForm.css';
import '../../components/shared/Toast.css';
import { ExamForm } from '../../components/exams/ExamForm.tsx';
import { Toast, useToast } from '../../components/shared/Toast';
import { readJSON } from '../../services/storage/localStorage';
import PageTemplate from '../../components/PageTemplate';

export default function ExamsCreatePage() {
  const { toasts, pushToast, removeToast } = useToast();
  const formRef = useRef<{ getSnapshot: () => any } | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiHtml, setAiHtml] = useState<string>('');

  const handleAIPropose = () => {
    const snap = formRef.current?.getSnapshot();
    const draft = readJSON('exam:draft');
    const data = snap?.values?.subject ? snap.values : draft;

    if (!data) { pushToast('Completa y guarda el formulario primero.','warn'); return; }

    const diff = data.difficulty;
    const tq = Number(data.totalQuestions || 10);
    const sample =
      diff === 'fácil' ? 'pregunta recall sencilla' :
      diff === 'medio' ? 'pregunta de comprensión' :
                         'pregunta de aplicación/análisis';

    const list = Array.from({ length: tq })
      .map((_, i) => `<li><strong>P${i+1}:</strong> ${sample} sobre <em>${data.subject}</em>.</li>`)
      .join('');

    setAiHtml(`
      <div class="ai-box">
        <h3>Propuesta inicial (${tq} preguntas · ${diff})</h3>
        <ol>${list}</ol>
        <p class="hint">* Demo. La integración real con IA se conectará en Services.</p>
      </div>
    `);
    pushToast('Propuesta IA generada (demo).', 'success');
  };

  return (
    <PageTemplate
      title="Exámenes"
      subtitle="Crea un nuevo examen para tu clase."
      actions={
        <>
          <button className="btn btn-secondary" data-action="add">Añadir</button>
          <button className="btn btn-primary" data-action="ai" onClick={()=>setAiOpen(true)}>
            Generar examen IA uwu
          </button>
        </>
      }
    >
      <section className="card">
        <h2>Crear nuevo examen</h2>
        <ExamForm ref={formRef} onToast={pushToast}/>
      </section>

      {aiOpen && (
        <section className="card">
          <h2>Generador IA (Sprint 2)</h2>
          <p>🚧 En construcción 🚧 <br />
            El DevTeam estará estresado por esto en el Sprint 2. </p>
          <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
            <button className="btn btn-primary" onClick={handleAIPropose}> Generar</button>
            <button className="btn btn-secondary" onClick={()=>{setAiOpen(false); setAiHtml('')}}>Cerrar</button>
          </div>
          <div className="ai-results" dangerouslySetInnerHTML={{ __html: aiHtml }} />
        </section>
      )}

      {toasts.map(t => (
        <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
      ))}
    </PageTemplate>
  );
}
