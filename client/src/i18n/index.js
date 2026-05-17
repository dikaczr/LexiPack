import { useSettings } from "../context/SettingsContext";
import sk from "./sk";
import en from "./en";

const translations = { sk, en };

/**
 * Vráti prekladovú funkciu t(path) pre aktuálny jazyk.
 * path je bodkami oddelená cesta, napr. "common.save"
 * alebo priamy objekt, napr. t("nav") vráti celú sekciu.
 *
 * Ak hodnota je funkcia (pre dynamické texty), vráti ju priamo —
 * volaj ju sám: t("saveAs.confirmText")("Zdroj", "Nový názov")
 */
export function useT() {
  const { settings } = useSettings();
  const lang = settings?.appLang ?? "sk";
  const dict = translations[lang] ?? sk;

  function t(path) {
    const parts = path.split(".");
    let val = dict;
    for (const part of parts) {
      if (val == null) return path;
      val = val[part];
    }
    return val ?? path;
  }

  return t;
}
