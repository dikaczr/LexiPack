export async function importJsonFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  const metadata = data.metadata || {};
  const words = data.words || [];
  const rows = words.map((row) => ({
    id: crypto.randomUUID(),
    ...row,
  }));

  return {
    metadata,
    rows,
  };
}
