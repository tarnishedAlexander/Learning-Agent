import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useExamForm } from '../../hooks/useExamForm.ts';
import { createExam } from '../../services/exams.service';

import type { ToastKind } from '../shared/Toast';
type Props = {
  onToast: (msg: string, type?: ToastKind) => void; 
  onGenerateAI?: () => void | Promise<void>;
};

export type ExamFormHandle = { getSnapshot: () => any };
export const ExamForm = forwardRef<ExamFormHandle, Props>(function ExamForm(
  { onToast, onGenerateAI },
  ref
) {
  const { setValue, validate, getSnapshot, values: hookValues, getTotalQuestions } = useExamForm();
  const [values, setValues] = useState({
    ...hookValues,
    multipleChoice: '',
    trueFalse: '',
    analysis: '',
    openEnded: '',
  });

  const totalQuestions = getTotalQuestions();

  const [step, setStep] = useState(0);
  const steps = ['Datos generales', 'Cantidad de preguntas', 'Tiempo y referencia'];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useImperativeHandle(ref, () => ({ getSnapshot }), [getSnapshot]);

  useEffect(() => { touchAndValidate();
    return () => {
      setValues({
        subject: '',
        difficulty: '',
        attempts: '',
        multipleChoice: '',
        trueFalse: '',
        analysis: '',
        openEnded: '',
        timeMinutes: '',
        reference: '',
      });
      setValue('subject', '');
      setValue('difficulty', '');
      setValue('attempts', '');
      setValue('multipleChoice', '');
      setValue('trueFalse', '');
      setValue('analysis', '');
      setValue('openEnded', '');
      setValue('timeMinutes', '');
      setValue('reference', '');
    };
  }, []);

  const onChange = (name: string, value: string) => {
    const v = name === 'subject' ? value.replace(/\s+/g,' ').trimStart() : value;
    setValues(prev => ({ ...prev, [name]: v }));
    setValue(name as any, v);
    touchAndValidate();
  };

  const touchAndValidate = () => {
    const { valid, errors } = validate();
    setErrors(errors);
    return valid;
  };

  const validStep = () => {
    if (step === 0) return !!(values.subject && values.difficulty && values.attempts);
    if (step === 1) return totalQuestions > 0;
    if (step === 2) return !!values.timeMinutes;
    return Boolean(values.timeMinutes) && !errors.timeMinutes;
  };

  const hasQuestions = totalQuestions > 0;

  const onResetStep = () => {
    if (step === 0) {
      setValues(prev => ({
        ...prev,
        subject: '',
        difficulty: '',
        attempts: '',
      }));
      setValue('subject', '');
      setValue('difficulty', '');
      setValue('attempts', '');
  onToast('Datos generales limpiados.', 'info');
    } else if (step === 1) {
      setValues(prev => ({
        ...prev,
        multipleChoice: '',
        trueFalse: '',
        analysis: '',
        openEnded: '',
      }));
      setValue('multipleChoice', '');
      setValue('trueFalse', '');
      setValue('analysis', '');
      setValue('openEnded', '');
  onToast('Cantidad de preguntas limpiada.', 'info');
    } else if (step === 2) {
      setValues(prev => ({
        ...prev,
        timeMinutes: '',
        reference: '',
      }));
      setValue('timeMinutes', '');
      setValue('reference', '');
  onToast('Tiempo y referencia limpiados.', 'info');
    }
    touchAndValidate();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!touchAndValidate()) return;
    if (step < 2) {
      setStep(s => s + 1);
      return;
    }
    if (!hasQuestions) {
      onToast('Debes escoger al menos una pregunta de algún tipo.','warn');
      return;
    }
    setSending(true);
    try {
      const snap = getSnapshot();
      const res = await createExam(snap.values);
  if (res?.ok) onToast('Examen creado correctamente.','info');
      else onToast(res?.error || 'Error desconocido.','error');
    } catch {
      onToast('No fue posible conectar con el servidor.','error');
    } finally {
      setSending(false);
    }
  };


  return (
    <form id="exam-form" onSubmit={onSubmit} noValidate className="card card-hover">
      <div className="card-content">
        <div style={{marginBottom: 16}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
            {steps.map((s, i) => (
              <div key={i} style={{
                fontWeight: step === i ? 700 : 400,
                color: step === i ? '#3B38A0' : '#888',
                borderBottom: step === i ? '2px solid #3B38A0' : '2px solid #eee',
                padding: '4px 12px',
                transition: 'all 0.2s',
                fontSize: 15
              }}>{s}</div>
            ))}
          </div>
        </div>

        <div className="form-grid">
          {step === 0 && <>
            <div className="form-group">
              <label htmlFor="subject">Materia *</label>
              <input id="subject" name="subject" type="text" maxLength={30}
                className="input-hover subject-hover"
                placeholder="Ej: Algorítmica 1"
                value={values.subject || ''} onChange={e=>onChange('subject', e.target.value)} />
              <small className="help">Máx. 30 caracteres</small>
              {errors.subject && <small className="error">{errors.subject}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Dificultad *</label>
              <select id="difficulty" name="difficulty"
                className="input-hover"
                value={values.difficulty || ''} onChange={e=>onChange('difficulty', e.target.value)}>
                <option value="">Selecciona…</option>
                <option value="fácil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="difícil">Difícil</option>
              </select>
              {errors.difficulty && <small className="error">{errors.difficulty}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="attempts">N.º de intentos *</label>
              <input id="attempts" name="attempts" type="number" min={1} step={1} placeholder="1"
                className="input-hover"
                value={values.attempts || ''} onChange={e=>onChange('attempts', e.target.value)} />
              {errors.attempts && <small className="error">{errors.attempts}</small>}
            </div>
          </>}

          {step === 1 && <>
            <div className="form-group" style={{gridColumn:'1/3', display:'flex', flexDirection:'column', alignItems:'center', width:'100%'}}>
              <label style={{ fontWeight: 700, textAlign: 'center', width:'100%' }}>Cantidad de preguntas por tipo *</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
                background: '#f6f9ff',
                borderRadius: '8px',
                border: '1px dashed #7A85C1',
                width: '100%',
                maxWidth: 600,
                margin: '0 auto'
              }}>
                <div style={{background:'#fff', border:'1px solid #e0e7ff', borderRadius:8, padding:'16px 12px'}}>
                  <label htmlFor="multipleChoice" style={{display:'block', marginBottom:10}}>Opción Múltiple</label>
                  <input id="multipleChoice" name="multipleChoice" type="number" min={0} step={1} placeholder="0"
                    className="input-hover"
                    value={values.multipleChoice || ''} onChange={e=>onChange('multipleChoice', e.target.value)} />
                </div>
                <div style={{background:'#fff', border:'1px solid #e0e7ff', borderRadius:8, padding:'16px 12px'}}>
                  <label htmlFor="trueFalse" style={{display:'block', marginBottom:10}}>Verdadero o Falso</label>
                  <input id="trueFalse" name="trueFalse" type="number" min={0} step={1} placeholder="0"
                    className="input-hover"
                    value={values.trueFalse || ''} onChange={e=>onChange('trueFalse', e.target.value)} />
                </div>
                <div style={{background:'#fff', border:'1px solid #e0e7ff', borderRadius:8, padding:'16px 12px'}}>
                  <label htmlFor="analysis" style={{display:'block', marginBottom:10}}>Análisis</label>
                  <input id="analysis" name="analysis" type="number" min={0} step={1} placeholder="0"
                    className="input-hover"
                    value={values.analysis || ''} onChange={e=>onChange('analysis', e.target.value)} />
                </div>
                <div style={{background:'#fff', border:'1px solid #e0e7ff', borderRadius:8}}>
                  <label htmlFor="openEnded" style={{display:'block', marginBottom:10}}>Ejercicio Abierto</label>
                  <input id="openEnded" name="openEnded" type="number" min={0} step={1} placeholder="0"
                    className="input-hover"
                    value={values.openEnded || ''} onChange={e=>onChange('openEnded', e.target.value)} />
                </div>
                <div style={{ width: '100%', marginTop: 16, fontWeight: 600, textAlign: 'center' }}>
                  Total de preguntas: <span>{totalQuestions}</span>
                </div>
              </div>
            </div>
          </>}

          {step === 2 && <>
            <div className="form-group">
              <label htmlFor="timeMinutes">Tiempo (min) *</label>
              <input id="timeMinutes" name="timeMinutes" type="number" min={45} max={240} step={1} placeholder="45"
                className="input-hover"
                value={values.timeMinutes || ''} onChange={e=>onChange('timeMinutes', e.target.value)} />
              {errors.timeMinutes && <small className="error">{errors.timeMinutes}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="reference">Material de referencia (opcional)</label>
              <textarea id="reference" name="reference" rows={3} placeholder="..."
                className="input-hover"
                value={values.reference || ''} onChange={e=>onChange('reference', e.target.value)} />
              <small className="help">Máx. 1000 caracteres</small>
              {errors.reference && <small className="error">{errors.reference}</small>}
            </div>
          </>}
        </div>
      </div>


      <div className="actions-row button-hover" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: 24, position: 'relative', minHeight: 64 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
              Anterior
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResetStep}
            disabled={
              (step === 0 && !values.subject && !values.difficulty && !values.attempts) ||
              (step === 1 && !values.multipleChoice && !values.trueFalse && !values.analysis && !values.openEnded) ||
              (step === 2 && !values.timeMinutes && !values.reference)
            }
          >
            Limpiar
          </button>
        </div>
        {/* Botón IA visible en el paso 2 si el prop existe */}
        {step === 2 && onGenerateAI && (
          <button
            type="button"
            className="btn btn-outline next-fixed"
            disabled={sending || !validStep()}
            onClick={() => { if (validStep()) onGenerateAI(); }}
          >
            Generar preguntas con IA
          </button>
        )}
        {step < 2 && (
          <button
            type="button"
            className="btn btn-primary float-button-animation next-fixed"
            disabled={sending || !validStep()}
            onClick={(e) => { e.preventDefault(); if (validStep()) setStep(s => s + 1); }}
          >
            Siguiente
          </button>
        )}
      </div>

    </form>
  );
});
