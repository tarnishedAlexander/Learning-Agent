import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useExamForm } from '../../hooks/useExamForm.ts';
import { createExam } from '../../services/exams.service';

type Props = { onToast: (msg: string, type?: 'success'|'warn'|'error') => void; };

export const ExamForm = forwardRef<{ getSnapshot: () => any }, Props>(function ExamForm({ onToast }, ref) {
  const { setValue, reset, validate, getSnapshot, values: hookValues } = useExamForm();
  const [values, setValues] = useState(hookValues);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [sending, setSending] = useState(false);

  useImperativeHandle(ref, () => ({ getSnapshot }), [getSnapshot]);

  useEffect(() => { touchAndValidate(); }, []);

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

  const valid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onReset = () => {
    setValues({ subject:'', difficulty:'', attempts:'', totalQuestions:'', timeMinutes:'', reference:'' } as any);
    reset();
    touchAndValidate();
    onToast('Formulario limpiado.');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!touchAndValidate()) return;
    setSending(true);
    try {
      const snap = getSnapshot();
      const res = await createExam(snap.values);
      if (res?.ok) onToast('Examen creado correctamente.','success');
      else onToast(res?.error || 'Error desconocido.','error');
    } catch {
      onToast('No fue posible conectar con el servidor.','error');
    } finally {
      setSending(false);
    }
  };

  return (
    <form id="exam-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="subject">Materia *</label>
          <input id="subject" name="subject" type="text" maxLength={80}
            placeholder="Ej: Algoritmica 1"
            value={values.subject || ''} onChange={e=>onChange('subject', e.target.value)} />
          <small className="help">Máx. 80 caracteres</small>
          {errors.subject && <small className="error">{errors.subject}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="difficulty">Dificultad *</label>
          <select id="difficulty" name="difficulty"
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
            value={values.attempts || ''} onChange={e=>onChange('attempts', e.target.value)} />
          {errors.attempts && <small className="error">{errors.attempts}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="totalQuestions">Total de preguntas *</label>
          <input id="totalQuestions" name="totalQuestions" type="number" min={1} step={1} placeholder="20"
            value={values.totalQuestions || ''} onChange={e=>onChange('totalQuestions', e.target.value)} />
          {errors.totalQuestions && <small className="error">{errors.totalQuestions}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="timeMinutes">Tiempo (min) *</label>
          <input id="timeMinutes" name="timeMinutes" type="number" min={1} step={1} placeholder="45"
            value={values.timeMinutes || ''} onChange={e=>onChange('timeMinutes', e.target.value)} />
          {errors.timeMinutes && <small className="error">{errors.timeMinutes}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="reference">Material de referencia (opcional)</label>
          <textarea id="reference" name="reference" rows={3} placeholder="... (preguntar sobre subir archivos o de donde poner sacar referencia)"
            value={values.reference || ''} onChange={e=>onChange('reference', e.target.value)} />
          <small className="help">Máx. 1000 caracteres</small>
          {errors.reference && <small className="error">{errors.reference}</small>}
        </div>
      </div>

      <div className="actions-row">
        <button type="submit" className="btn btn-primary" disabled={!valid || sending}>
          {sending ? 'Enviando…' : 'Generar'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>Limpiar</button>
        <span className="badge" style={{ color: valid ? '#25a18e' : '#374151' }}>
          {valid ? 'Listo para enviar' : 'Borrador'}
        </span>
      </div>
    </form>
  );
});
