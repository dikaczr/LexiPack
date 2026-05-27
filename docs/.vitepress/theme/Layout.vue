<template>
  <PrintAllLayout v-if="isPrintAll" />
  <DefaultThemeLayout v-else>
    <template #doc-before>
      <PrintButton />
    </template>
  </DefaultThemeLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultThemeLayout from 'vitepress/dist/client/theme-default/Layout.vue'
import PrintButton from './PrintButton.vue'
import PrintAllLayout from './PrintAllLayout.vue'

const { frontmatter } = useData()
const isPrintAll = computed(() => frontmatter.value.layout === 'print-all')
</script>
