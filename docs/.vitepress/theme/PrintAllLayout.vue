<template>
  <div class="print-all-page">
    <!-- Hlavička stránky (skrytá pri tlači) -->
    <div class="print-all-header no-print">
      <a class="back-link" :href="backLink">← Späť na dokumentáciu</a>
      <div class="header-main">
        <h1>Návod na použitie — LexiPack</h1>
        <p class="subtitle">Celý manuál pripravený na tlač ({{ chapters.length }} kapitol)</p>
        <button class="print-main-btn" @click="doPrint">🖨 Tlačiť celý návod</button>
      </div>
    </div>

    <!-- Hlavička viditeľná len pri tlači -->
    <div class="print-doc-header print-only">
      <strong>LexiPack</strong> — Návod na použitie
    </div>

    <!-- Všetky kapitoly -->
    <div class="chapters-wrapper">
      <div
        v-for="(ch, idx) in chapters"
        :key="ch.path"
        class="chapter-block"
      >
        <div class="chapter-label no-print">
          Kapitola {{ idx + 1 }}
        </div>
        <div class="vp-doc">
          <component :is="ch.component" />
        </div>
      </div>
    </div>

    <!-- Tlačidlo dole (skryté pri tlači) -->
    <div class="print-all-footer no-print">
      <button class="print-main-btn" @click="doPrint">🖨 Tlačiť celý návod</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()

const ORDER = [
  'uvod', 'prihlasenie',
  'zoznam-balikov', 'novy-balik',
  'editor', 'slova', 'metadata', 'skratky', 'import-export',
  'ai-generovanie', 'ai-navrhy',
  'kvalita', 'kvalita-domeny', 'kvalita-cefr', 'kvalita-priklady',
  'kvalita-duplicity', 'kvalita-pokrytie', 'kvalita-zdroje',
  'reviews', 'zalozky',
  'nastavenia', 'autocorrect', 'analytika', 'administracia',
]

const mods = import.meta.glob('../../manual/*.md', { eager: true })

const chapters = computed(() =>
  ORDER
    .map(name => {
      const key = `../../manual/${name}.md`
      return mods[key] ? { path: key, component: mods[key].default } : null
    })
    .filter(Boolean)
)

const backLink = computed(() => `${site.value.base}manual/uvod`)

function doPrint() {
  window.print()
}
</script>

<style>
.print-all-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  font-family: var(--vp-font-family-base);
}

.print-all-header {
  margin-bottom: 48px;
}

.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  margin-bottom: 20px;
  transition: color 0.15s;
}
.back-link:hover { color: var(--vp-c-brand-1); }

.header-main h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--vp-c-text-1);
}

.header-main .subtitle {
  color: var(--vp-c-text-2);
  font-size: 14px;
  margin: 0 0 20px;
}

.print-main-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: var(--vp-c-brand-1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  font-family: inherit;
}
.print-main-btn:hover { opacity: 0.88; }

.chapter-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  margin-bottom: 4px;
  opacity: 0.6;
}

.chapter-block {
  padding: 40px 0;
  border-bottom: 2px solid var(--vp-c-divider);
}
.chapter-block:last-child {
  border-bottom: none;
}

.print-all-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--vp-c-divider);
}

/* Prvok viditeľný iba pri tlači */
.print-only {
  display: none;
}

.print-doc-header {
  font-size: 10pt;
  color: #555;
  border-bottom: 1px solid #ccc;
  padding-bottom: 6px;
  margin-bottom: 24px;
}

/* --- PRINT --- */
@media print {
  .print-all-page {
    max-width: 100%;
    padding: 0;
  }

  .print-only {
    display: block !important;
  }

  .no-print {
    display: none !important;
  }

  .print-doc-header {
    display: block;
  }

  .chapter-block {
    padding: 0;
    border: none;
  }

  /* Každá kapitola okrem prvej začína na novej strane */
  .chapter-block + .chapter-block {
    break-before: page;
    page-break-before: always;
  }

  /* Zabraň rozdeleniu obrázkov cez stranu */
  img {
    break-inside: avoid;
    page-break-inside: avoid;
    max-width: 100%;
  }

  .vp-doc a[href]::after {
    content: none !important;
  }
}
</style>
