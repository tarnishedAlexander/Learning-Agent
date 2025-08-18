import { readJSON, removeItem, saveJSON } from '../services/storage/localStorage.ts';

type Values = {
  subject: string;
  difficulty: 'fácil' | 'medio' | 'difícil' | '';
  attempts: string | number;
  totalQuestions: string | number;
  timeMinutes: string | number;
  reference?: string;
};

const limits = { subjectMax: 80, referenceMax: 1000 };

export function useExamForm() {
  const draft = (readJSON('exam:draft') || {}) as Partial<Values>;
  let values: Values = {
    subject: '', difficulty: '', attempts: '', totalQuestions: '', timeMinutes: '', reference: '', ...draft
  };
  let errors: Record<string, string> = {};

  const setValue = (name: keyof Values, value: any) => {
    (values as any)[name] = value;
    validateField(name, value);
    saveJSON('exam:draft', values);
  };

  const reset = () => {
    values = { subject:'', difficulty:'', attempts:'', totalQuestions:'', timeMinutes:'', reference:'' };
    errors = {}; removeItem('exam:draft');
  };

  const asInt = (v: any) => Number.isInteger(Number(v)) ? Number(v) : NaN;
  const posInt = (v: any) => asInt(v) > 0;

  const validate = () => {
    errors = {};
    if (!values.subject || !values.subject.toString().trim()) errors.subject = 'La materia es obligatoria.';
    else if (values.subject.toString().trim().length > limits.subjectMax) errors.subject = `Máximo ${limits.subjectMax} caracteres.`;

    const allowed = ['fácil','medio','difícil'];
    if (!allowed.includes(values.difficulty || '')) errors.difficulty = 'Selecciona una dificultad válida.';

    if (!posInt(values.attempts)) errors.attempts = 'Debe ser entero > 0.';
    if (!posInt(values.totalQuestions)) errors.totalQuestions = 'Debe ser entero > 0.';
    if (!posInt(values.timeMinutes)) errors.timeMinutes = 'Debe ser entero > 0.';

    if (values.reference && values.reference.length > limits.referenceMax) {
      errors.reference = `Máximo ${limits.referenceMax} caracteres.`;
    }
    return { valid: Object.keys(errors).length === 0, errors };
  };

  const validateField = (name: keyof Values, value: any) => {
    if (name === 'subject') {
      if (!value.toString().trim()) errors.subject = 'La materia es obligatoria.';
      else if (value.toString().trim().length > limits.subjectMax) errors.subject = `Máximo ${limits.subjectMax} caracteres.`;
      else delete errors.subject;
    }
    if (name === 'difficulty') {
      const allowed = ['fácil','medio','difícil'];
      if (!allowed.includes(value || '')) errors.difficulty = 'Selecciona una dificultad válida.';
      else delete errors.difficulty;
    }
    if (['attempts','totalQuestions','timeMinutes'].includes(name as any)) {
      const n = Number(value);
      if (!(Number.isInteger(n) && n > 0)) errors[name as string] = 'Debe ser entero > 0.';
      else delete errors[name as string];
    }
    if (name === 'reference') {
      if (value && value.length > limits.referenceMax) errors.reference = `Máximo ${limits.referenceMax} caracteres.`;
      else delete errors.reference;
    }
  };

  return {
    setValue, reset, validate,
    getSnapshot: () => ({ values: { ...values }, errors: { ...errors } }),
    values
  };
}
