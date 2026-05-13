import axios from "axios";

const API_URL = "http://localhost:3001/api";

async function requestWithRetry(requestFn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      console.error(`AI attempt ${attempt} failed`, err);

      if (attempt === retries) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

export async function generateTranslation(row) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/generate-translation`, { row }),
  );

  return response.data;
}

export async function generateTopic(word) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/generate-topic`, { word }),
  );

  return response.data.topic;
}

export async function suggestWords(payload) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/suggest-words`, payload),
  );

  return response.data.suggestions;
}

export async function generateColumn(row, field) {
  const response = await requestWithRetry(() =>
    axios.post(`${API_URL}/generate-column`, {
      row,
      field,
    }),
  );

  return response.data.value;
}
