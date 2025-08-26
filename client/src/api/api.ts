import axios from "axios";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const OPENAI_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function getResponse(message: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("La clave de la API de OpenAI no está configurada.");
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    };

    const body = {
      model: "openai/gpt-oss-20b:free",
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
      max_tokens: 1500,
    };

    const response = await axios.post(OPENAI_API_URL, body, { headers });

    const aiResponse = response.data.choices?.[0]?.message?.content;
    if (aiResponse) {
      return aiResponse;
    }

    throw new Error("Respuesta inesperada de la API de OpenAI.");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error en la llamada a la API:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Error en la llamada a la API:", error);
    }
    
    throw new Error("Error al comunicarse con la API. Por favor, inténtalo de nuevo.");
  }
}