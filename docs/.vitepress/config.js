import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LexiPack',
  description: 'Dokumentácia pre používateľov a administrátorov',
  lang: 'sk-SK',
  base: '/lexipack/docs/',
  outDir: './dist',

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'LexiPack Docs',

    nav: [
      { text: 'Používateľský manuál', link: '/manual/uvod' },
      { text: 'Nasadenie', link: '/deploy/poziadavky' },
    ],

    sidebar: {
      '/manual/': [
        {
          text: 'Začíname',
          items: [
            { text: 'Čo je LexiPack', link: '/manual/uvod' },
            { text: 'Prihlásenie', link: '/manual/prihlasenie' },
          ],
        },
        {
          text: 'Zoznam balíkov',
          items: [
            { text: 'Prehľad balíkov', link: '/manual/zoznam-balikov' },
            { text: 'Vytvorenie balíka', link: '/manual/novy-balik' },
          ],
        },
        {
          text: 'Editor',
          items: [
            { text: 'Prehľad editora', link: '/manual/editor' },
            { text: 'Práca so slovami', link: '/manual/slova' },
            { text: 'Metadáta balíka', link: '/manual/metadata' },
            { text: 'Klávesové skratky', link: '/manual/skratky' },
            { text: 'Import a export', link: '/manual/import-export' },
          ],
        },
        {
          text: 'AI funkcie',
          items: [
            { text: 'Generovanie polí', link: '/manual/ai-generovanie' },
            { text: 'Návrhy slov', link: '/manual/ai-navrhy' },
          ],
        },
        {
          text: 'Kontrola kvality',
          items: [
            { text: 'Prehľad', link: '/manual/kvalita' },
            { text: 'Konzistencia domén', link: '/manual/kvalita-domeny' },
            { text: 'Konzistencia úrovní', link: '/manual/kvalita-cefr' },
            { text: 'Kvalita príkladov', link: '/manual/kvalita-priklady' },
            { text: 'Duplicitné významy', link: '/manual/kvalita-duplicity' },
            { text: 'Pokrytie tém', link: '/manual/kvalita-pokrytie' },
            { text: 'Trusted Source', link: '/manual/kvalita-zdroje' },
          ],
        },
        {
          text: 'Recenzie',
          items: [
            { text: 'Recenzie slov', link: '/manual/reviews' },
            { text: 'Záložky', link: '/manual/zalozky' },
          ],
        },
        {
          text: 'Ďalšie funkcie',
          items: [
            { text: 'Nastavenia', link: '/manual/nastavenia' },
            { text: 'Automatické korekcie', link: '/manual/autocorrect' },
            { text: 'Analytika', link: '/manual/analytika' },
            { text: 'Administrácia systému', link: '/manual/administracia' },
          ],
        },
      ],
      '/deploy/': [
        {
          text: 'Nasadenie',
          items: [
            { text: 'Požiadavky', link: '/deploy/poziadavky' },
            { text: 'Inštalácia', link: '/deploy/instalacia' },
            { text: 'Konfigurácia', link: '/deploy/konfiguracia' },
            { text: 'Databáza', link: '/deploy/databaza' },
            { text: 'Spustenie (PM2)', link: '/deploy/spustenie' },
            { text: 'Aktualizácia', link: '/deploy/aktualizacia' },
          ],
        },
      ],
    },

    socialLinks: [],

    footer: {
      message: 'LexiPack v1.0',
      copyright: '© 2026 TechDoc',
    },

    search: {
      provider: 'local',
    },

    outline: {
      label: 'Na tejto stránke',
    },

    docFooter: {
      prev: 'Predchádzajúca',
      next: 'Nasledujúca',
    },

    darkModeSwitchLabel: 'Vzhľad',
    lightModeSwitchTitle: 'Svetlý režim',
    darkModeSwitchTitle: 'Tmavý režim',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Späť nahor',
  },
})
