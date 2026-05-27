<template>
  <div class="print-toolbar no-print">
    <button class="print-btn" @click="printChapter" title="Tlačiť túto kapitolu">
      🖨 Tlačiť kapitolu
    </button>
    <a class="print-btn" :href="allLink" title="Otvoriť celý návod pre tlač">
      🖨 Celý návod
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()
const allLink = computed(() => `${site.value.base}manual/tlac`)

function printChapter() {
  window.print()
}
</script>

<style scoped>
.print-toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 0 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 20px;
}

.print-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 13px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.4;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  font-family: inherit;
}

.print-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}
</style>
