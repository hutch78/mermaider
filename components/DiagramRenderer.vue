<template>
  <component
    :is="activeComponent"
    :code="code"
    :background-color="backgroundColor"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MermaidRenderer from './MermaidRenderer.vue'
import PlantUmlRenderer from './PlantUmlRenderer.vue'

interface Props {
  code: string
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: '#ffffff'
})

const detectedType = computed<'mermaid' | 'plantuml'>(() => {
  const text = props.code?.trim() ?? ''
  if (!text) {
    return 'mermaid'
  }

  const lower = text.toLowerCase()

  // Basic PlantUML detection
  if (lower.includes('@startuml') || lower.startsWith('@start')) {
    return 'plantuml'
  }

  // Heuristics for Mermaid
  const mermaidKeywords = [
    'graph ',
    'flowchart',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'erDiagram',
    'gantt',
    'journey',
    'pie'
  ]

  if (mermaidKeywords.some((kw) => text.includes(kw))) {
    return 'mermaid'
  }

  // Default to Mermaid for unknown text, since the app
  // was originally Mermaid-first.
  return 'mermaid'
})

const activeComponent = computed(() => {
  return detectedType.value === 'plantuml' ? PlantUmlRenderer : MermaidRenderer
})
</script>

