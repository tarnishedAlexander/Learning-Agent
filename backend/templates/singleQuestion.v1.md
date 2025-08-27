Instrucciones:
- Genera **una única pregunta** sobre el tema indicado.
- Nivel de dificultad: {{level}}.
- Formato: múltiple opción.
- Incluye **cuatro opciones**: A, B, C, D.
- Indica cuál es la **respuesta correcta**.
- Proporciona una **explicación breve**.
- Las opciones incorrectas deben ser **plausibles distractores**.
- Evita repeticiones o ambigüedades.

Salida en **JSON** con la siguiente estructura:

{
  "subject": "{{subject}}",
  "level": "{{level}}",
  "question": {
    "id": "q1",
    "question": "Aquí va la pregunta generada",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "answer": "A",
    "explanation": "Explicación breve de la respuesta."
  }
}
