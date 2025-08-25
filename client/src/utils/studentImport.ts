import * as XLSX from 'xlsx';

export type ParsedStudent = {
  studentName: string;
  studentLastname: string;
  studentCode: string;
  email?: string;
  extras?: Record<string, string>;
  _row: number;
};

export type ParseResult = {
  rows: ParsedStudent[];
  warnings: string[];
  errors: string[];
  meta: { fileName: string; totalRows: number; sizeBytes: number };
  duplicates: string[];
  extraColumns: string[];
};

const MAX_SIZE_BYTES = 1 * 1024 * 1024;
const MAX_ROWS = 100;

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const headerCandidates: Record<
  'studentName' | 'studentLastname' | 'studentCode' | 'email',
  string[]
> = {
  studentName: ['nombre', 'nombres'],
  studentLastname: ['apellido', 'apellidos'],
  studentCode: ['codigo', 'código', 'cod', 'code'],
  email: ['correo', 'email', 'mail', 'e-mail'],
};

function mapHeaderToKey(h: string): keyof typeof headerCandidates | null {
  const n = normalize(h);
  for (const key of Object.keys(headerCandidates) as (keyof typeof headerCandidates)[]) {
    if (headerCandidates[key].some(c => n === c)) return key;
  }
  return null;
}

function readSheetAsRows(buf: ArrayBuffer): { header: string[]; data: any[][] } {
  const workbook = XLSX.read(buf, { type: 'array' });
  if (!workbook.SheetNames?.length) throw new Error('No se pudo leer el archivo.');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' }) as string[][];
  const header = (rows[0] || []).map(h => String(h ?? ''));
  const data = rows.slice(1);
  return { header, data };
}

export async function parseAndValidateStudentFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > MAX_SIZE_BYTES) {
    errors.push(`El archivo supera 1MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
  }

  const buf = await file.arrayBuffer();
  const { header, data } = readSheetAsRows(buf);

  const headerMap: Partial<Record<keyof typeof headerCandidates, number>> = {};
  header.forEach((h, idx) => {
    const key = mapHeaderToKey(h);
    if (key) headerMap[key] = idx;
  });

  const missing: string[] = [];
  if (headerMap.studentName === undefined) missing.push('Nombre/Nombres');
  if (headerMap.studentLastname === undefined) missing.push('Apellido/Apellidos');
  if (headerMap.studentCode === undefined) missing.push('Código/Codigo/Cod/Code');
  if (missing.length) errors.push(`Faltan columnas obligatorias: ${missing.join(', ')}.`);

  const usedIdx = new Set<number>();
  (['studentName','studentLastname','studentCode','email'] as const).forEach(k => {
    const idx = headerMap[k];
    if (idx !== undefined) usedIdx.add(idx);
  });

  const extraColumnIdx: number[] = [];
  const extraColumns: string[] = [];
  header.forEach((label, i) => {
    if (!usedIdx.has(i)) {
      extraColumnIdx.push(i);
      extraColumns.push(label);
    }
  });

  const rows: ParsedStudent[] = [];
  data.forEach((r, i) => {
    const rowIdx = i + 2;
    const name = headerMap.studentName != null ? String(r[headerMap.studentName] || '').trim() : '';
    const lastname = headerMap.studentLastname != null ? String(r[headerMap.studentLastname] || '').trim() : '';
    const codeRaw = headerMap.studentCode != null ? String(r[headerMap.studentCode] || '').trim() : '';
    const email = headerMap.email != null ? String(r[headerMap.email] || '').trim() : '';

    if (!name && !lastname && !codeRaw && !email && extraColumnIdx.every(ci => !String(r[ci] || '').trim())) return;

    const extras: Record<string,string> = {};
    extraColumnIdx.forEach((ci) => {
      const label = header[ci];
      const val = String(r[ci] ?? '').trim();
      if (val) extras[label] = val;
    });

    rows.push({
      studentName: name,
      studentLastname: lastname,
      studentCode: codeRaw,
      email: email || undefined,
      extras: Object.keys(extras).length ? extras : undefined,
      _row: rowIdx
    });
  });

  if (rows.length > MAX_ROWS) errors.push(`El archivo contiene más de ${MAX_ROWS} filas (${rows.length}).`);
  else if (rows.length === 0) errors.push('No se encontraron filas de estudiantes para procesar.');

  const seen = new Map<string, number>();
  const duplicatesSet = new Set<string>();
  for (const r of rows) {
    const k = normalize(r.studentCode);
    if (!k) continue;
    if (seen.has(k)) duplicatesSet.add(r.studentCode);
    else seen.set(k, 1);
  }
  const duplicates = Array.from(duplicatesSet);
  if (duplicates.length) warnings.push(`Se detectaron códigos duplicados en el archivo: ${duplicates.join(', ')}`);

  return {
    rows,
    warnings,
    errors,
    meta: { fileName: file.name, totalRows: rows.length, sizeBytes: file.size },
    duplicates,
    extraColumns
  };
}
