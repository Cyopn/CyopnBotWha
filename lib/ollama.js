const axios = require("axios");
const { getConversationHistory } = require("./db");
require("dotenv").config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const OLLAMA_CONTEXT_LIMIT = Number(process.env.OLLAMA_CONTEXT_LIMIT || 20);

// Puedes personalizar este prompt desde .env usando OLLAMA_SYSTEM_PROMPT
const OLLAMA_SYSTEM_PROMPT =
    process.env.OLLAMA_SYSTEM_PROMPT ||
    "Eres chip torres bot men, un asistente util y claro. Responde en espanol de forma breve y con buen contexto del chat actual.";

const isMessageAboutBot = (message) => {
    const text = String(message || "").toLowerCase();
    if (!text.length) return false;
    return /\b(bot|cyopnbot|cyopn|asistente)\b/.test(text);
};

const isBotMenuRequest = (message) => {
    const text = String(message || "").toLowerCase();
    if (!text.length) return false;
    const hasBotWord = /\b(bot|cyopnbot|cyopn|tu|tus|te)\b/.test(text);
    const hasMenuWord = /\b(menu|comando|comandos)\b/.test(text);
    const hasMenuIntent = /\b(cuales|cual|dime|muestrame|lista|ayuda|help)\b/.test(text);
    return hasMenuWord && (hasBotWord || hasMenuIntent);
};

const chatWithOllama = async (chatId, userPrompt) => {
    const history = await getConversationHistory(chatId, OLLAMA_CONTEXT_LIMIT);
    const messages = [
        {
            role: "system",
            content: OLLAMA_SYSTEM_PROMPT,
        },
        ...history.map((entry) => ({
            role: entry.role === "assistant" ? "assistant" : "user",
            content: entry.content,
        })),
        {
            role: "user",
            content: userPrompt,
        },
    ];

    const { data } = await axios.post(
        `${OLLAMA_HOST}/api/chat`,
        {
            model: OLLAMA_MODEL,
            stream: false,
            messages,
        },
        {
            timeout: 120000,
        },
    );

    return data?.message?.content?.trim() || "No pude generar una respuesta.";
};

module.exports = {
    OLLAMA_HOST,
    OLLAMA_MODEL,
    OLLAMA_SYSTEM_PROMPT,
    OLLAMA_CONTEXT_LIMIT,
    isMessageAboutBot,
    isBotMenuRequest,
    chatWithOllama,
};
