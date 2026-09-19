// Most common pack topics, written in the pack's own (target) language.
// The first entry is the catch-all topic. Keep every list in the same order.
const COMMON_TOPICS = {
  en: ["general", "food and drink", "family", "home", "travel", "transport", "work", "business", "education", "health", "shopping", "clothing", "weather", "nature", "animals", "technology", "sports", "hobbies", "feelings", "time and dates", "city", "culture"],
  es: ["general", "comida y bebida", "familia", "hogar", "viajes", "transporte", "trabajo", "negocios", "educación", "salud", "compras", "ropa", "clima", "naturaleza", "animales", "tecnología", "deportes", "aficiones", "sentimientos", "tiempo y fechas", "ciudad", "cultura"],
  de: ["allgemein", "essen und trinken", "familie", "zuhause", "reisen", "verkehr", "arbeit", "wirtschaft", "bildung", "gesundheit", "einkaufen", "kleidung", "wetter", "natur", "tiere", "technologie", "sport", "hobbys", "gefühle", "zeit und datum", "stadt", "kultur"],
  fr: ["général", "nourriture et boissons", "famille", "maison", "voyages", "transports", "travail", "affaires", "éducation", "santé", "achats", "vêtements", "météo", "nature", "animaux", "technologie", "sports", "loisirs", "sentiments", "temps et dates", "ville", "culture"],
  it: ["generale", "cibo e bevande", "famiglia", "casa", "viaggi", "trasporti", "lavoro", "affari", "istruzione", "salute", "acquisti", "abbigliamento", "meteo", "natura", "animali", "tecnologia", "sport", "hobby", "sentimenti", "tempo e date", "città", "cultura"],
  sk: ["všeobecné", "jedlo a nápoje", "rodina", "domov", "cestovanie", "doprava", "práca", "obchod", "vzdelávanie", "zdravie", "nakupovanie", "oblečenie", "počasie", "príroda", "zvieratá", "technológie", "šport", "záľuby", "pocity", "čas a dátumy", "mesto", "kultúra"],
  cs: ["obecné", "jídlo a nápoje", "rodina", "domov", "cestování", "doprava", "práce", "obchod", "vzdělávání", "zdraví", "nakupování", "oblečení", "počasí", "příroda", "zvířata", "technologie", "sport", "záliby", "pocity", "čas a data", "město", "kultura"],
  pl: ["ogólne", "jedzenie i napoje", "rodzina", "dom", "podróże", "transport", "praca", "biznes", "edukacja", "zdrowie", "zakupy", "ubrania", "pogoda", "przyroda", "zwierzęta", "technologia", "sport", "hobby", "uczucia", "czas i daty", "miasto", "kultura"],
  hu: ["általános", "étel és ital", "család", "otthon", "utazás", "közlekedés", "munka", "üzlet", "oktatás", "egészség", "vásárlás", "ruházat", "időjárás", "természet", "állatok", "technológia", "sport", "hobbik", "érzelmek", "idő és dátumok", "város", "kultúra"],
};

// Languages without a curated list fall back to English.
export function getCommonTopics(lang) {
  return COMMON_TOPICS[lang] ?? COMMON_TOPICS.en;
}
