<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden">
    <!-- Header with Edit Button and Color Picker -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">
        Mermaid Diagram Renderer
      </h1>
      <div class="flex items-center gap-3">
        <!-- Saved Snippets Dropdown -->
        <USelect
          v-model="selectedSnippetId"
          :options="snippetOptions"
          placeholder="Load saved snippet..."
          :disabled="snippets.length === 0"
          class="min-w-[200px]"
          @update:model-value="handleSnippetSelect"
        />
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
            ref="textareaRef"
            v-model="diagramCode"
            placeholder="Paste Mermaid or PlantUML (.puml) text here..."
            :rows="25"
            class="font-mono text-sm"
            @input="handleCodeChange"
            @paste="handlePaste"
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
import { useSnippetPersistence } from '~/composables/useSnippetPersistence'
import type { Snippet } from '~/types/snippet'

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
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Initialize snippet persistence
const { saveSnippet, getAllSnippets } = useSnippetPersistence()

// Snippets state
const snippets = ref<Snippet[]>([])
const selectedSnippetId = ref<string | null>(null)
const isLoadingSnippets = ref(false)

// Convert snippets to select options
const snippetOptions = computed(() => {
  return snippets.value.map((snippet) => ({
    label: snippet.title,
    value: snippet.id
  }))
})

// Load all snippets
const loadSnippets = async () => {
  if (!import.meta.client) {
    return
  }

  try {
    isLoadingSnippets.value = true
    const loadedSnippets = await getAllSnippets()
    snippets.value = loadedSnippets
  } catch (error) {
    console.error('Error loading snippets:', error)
  } finally {
    isLoadingSnippets.value = false
  }
}

// Handle snippet selection
const handleSnippetSelect = async (snippetId: string | null) => {
  if (!snippetId) {
    return
  }

  const snippet = snippets.value.find((s) => s.id === snippetId)
  if (snippet) {
    // Clear any pending save timeout to prevent saving the old code
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    
    // Update code without triggering save
    previousCode.value = snippet.code
    diagramCode.value = snippet.code
    // Mark that we're loading a snippet so we don't save it immediately
    isInitialLoad = false
    // Open modal to show the loaded code
    isModalOpen.value = true
    // Reset selection after a brief delay to allow re-selection
    nextTick(() => {
      setTimeout(() => {
        selectedSnippetId.value = null
      }, 100)
    })
  }
}

// Track previous code to detect significant changes (pastes)
const previousCode = ref(diagramCode.value)
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let isInitialLoad = true
let isPasting = false
let modalJustOpened = false

// Get the actual current value from the textarea element
const getCurrentCode = (): string => {
  if (textareaRef.value) {
    return textareaRef.value.value
  }
  return diagramCode.value
}

// Handle paste events specifically
const handlePaste = async (event: ClipboardEvent) => {
  isPasting = true
  
  // Wait for paste to complete
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50)) // Wait for paste to fully complete
  
  // Get the actual value from the textarea element, not the reactive ref
  const currentCode = getCurrentCode()
  const previousCodeValue = previousCode.value
  
  // Only save if the code actually changed and is different from previous
  if (currentCode && currentCode.trim().length > 0 && currentCode !== previousCodeValue) {
    // Clear any pending save
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    
    // Update the reactive ref to match
    diagramCode.value = currentCode
    
    // Save the pasted code immediately
    await saveSnippet(currentCode)
    await loadSnippets()
    previousCode.value = currentCode
  }
  
  isPasting = false
}

const handleCodeChange = async (event?: Event) => {
  // Get the actual current value from the textarea element
  const currentCode = getCurrentCode()
  const previousCodeValue = previousCode.value

  // Skip saving on initial load to avoid saving the default code
  if (isInitialLoad) {
    isInitialLoad = false
    previousCode.value = currentCode
    return
  }

  // Skip if modal just opened (to avoid saving when textarea initializes)
  if (modalJustOpened) {
    modalJustOpened = false
    previousCode.value = currentCode
    return
  }

  // Skip if we're handling a paste (paste handler will save)
  if (isPasting) {
    return
  }

  // Clear any pending save
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // Detect significant changes (likely a paste):
  // - Code length changed by more than 50 characters
  // - Or code changed from empty/nearly empty to substantial content
  const isSignificantChange =
    Math.abs(currentCode.length - previousCodeValue.length) > 50 ||
    (previousCodeValue.trim().length < 10 && currentCode.trim().length >= 10)

  // Only save if the code actually changed
  if (currentCode !== previousCodeValue) {
    if (isSignificantChange && currentCode.trim().length > 0) {
      // Save immediately for significant changes (pastes that weren't caught by paste handler)
      await saveSnippet(currentCode)
      // Reload snippets to update the dropdown
      await loadSnippets()
      previousCode.value = currentCode
    } else if (currentCode.trim().length > 0) {
      // Debounce saves for smaller changes (typing)
      saveTimeout = setTimeout(async () => {
        // Get the latest code from the textarea element
        const latestCode = getCurrentCode()
        if (latestCode !== previousCode.value && latestCode.trim().length > 0) {
          await saveSnippet(latestCode)
          // Reload snippets to update the dropdown
          await loadSnippets()
          previousCode.value = latestCode
        }
      }, 2000) // Save after 2 seconds of inactivity
    }
  }

  previousCode.value = currentCode
}

// Watch for modal opening to prevent saving on initialization
watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    modalJustOpened = true
    // Update previousCode to current when modal opens
    nextTick(() => {
      previousCode.value = getCurrentCode()
    })
  }
})

// Load snippets on mount
onMounted(() => {
  loadSnippets()
})

// Cleanup on unmount
onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})
</script>

