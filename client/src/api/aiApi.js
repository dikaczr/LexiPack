import axios from "axios";

import { API_BASE } from "../config";
const API_URL = `${API_BASE}/api`;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestWithRetry(requestFn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      console.error(`AI attempt ${attempt} failed`, err);
      // Neopakuj pri chybách servera (4xx/5xx) — len pri sieťových výpadkoch
      if (err?.response?.status) throw err;
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

export async function translateWord(word, fromLang, toLang, token) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/translate-word`, { word, fromLang, toLang }, { headers: authHeaders(token) }),
  );
  return response.data.translation;
}

export async function generateTranslation(row, targetLang, nativeLang, token, packFile) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/generate-translation`, { row, targetLang, nativeLang, packFile }, { headers: authHeaders(token) }),
  );
  return response.data;
}

export async function generateTopic(word, targetLang, token) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/generate-topic`, { word, targetLang }, { headers: authHeaders(token) }),
  );
  return response.data.topic;
}

export async function suggestWords(payload, token, packFile) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/suggest-words`, { ...payload, packFile }, { headers: authHeaders(token) }),
  );
  return response.data.suggestions;
}

export async function generateColumn(row, field, targetLang, nativeLang, token, packFile) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/generate-column`, { row, field, targetLang, nativeLang, packFile }, { headers: authHeaders(token) }),
  );
  return response.data.value;
}

export async function generateImage(prompt, negative, token) {
  const response = await axios.post(
    `${API_URL}/generate-image`,
    { prompt, negative },
    { headers: authHeaders(token), timeout: 120000 },
  );
  return response.data.image;
}
