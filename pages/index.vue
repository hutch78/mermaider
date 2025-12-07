<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden">
    <!-- Header with Edit Button and Color Picker -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">
        Mermaid Diagram Renderer
      </h1>
      <div class="flex items-center gap-3">
        <!-- Background Color Picker -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Background:
          </label>
          <div class="relative">
            <input
              v-model="backgroundColor"
              type="color"
              class="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              @input="saveBackgroundColor"
            />
          </div>
        </div>
        <UButton
          icon="i-heroicons-pencil-square"
          label="Edit Diagram"
          @click="isModalOpen = true"
        />
      </div>
    </div>

    <!-- Full Width Rendering Area -->
    <div class="flex-1 w-full overflow-hidden">
      <DiagramRenderer
        :code="diagramCode"
        :background-color="backgroundColor"
        class="w-full h-full"
      />
    </div>

    <!-- Modal for Text Input -->
    <UModal v-model="isModalOpen" :ui="{ width: 'w-full sm:max-w-4xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Diagram Code (Mermaid or PlantUML)
            </h3>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <div class="flex flex-col gap-4">
          <UTextarea
            v-model="diagramCode"
            placeholder="Paste Mermaid or PlantUML (.puml) text here..."
            :rows="25"
            class="font-mono text-sm"
            @input="handleCodeChange"
          />
          
          <div class="flex justify-end gap-2">
            <UButton
              label="Close"
              color="gray"
              variant="ghost"
              @click="isModalOpen = false"
            />
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import DiagramRenderer from '~/components/DiagramRenderer.vue'

const STORAGE_KEY = 'mermaid-background-color'
const DEFAULT_BACKGROUND = '#ffffff'

// Load background color from localStorage or use default
const backgroundColor = ref(DEFAULT_BACKGROUND)

if (import.meta.client) {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    backgroundColor.value = saved
  }
}

const saveBackgroundColor = () => {
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, backgroundColor.value)
  }
}

const diagramCode = ref(`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`)

const isModalOpen = ref(false)

const handleCodeChange = () => {
  // Placeholder for future enhancements (debounce, autosave, etc.)
}
</script>

