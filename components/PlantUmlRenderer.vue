<template>
  <div
    ref="containerRef"
    class="relative w-full h-full overflow-hidden cursor-move"
    :style="{ backgroundColor }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @wheel.prevent="handleWheel"
  >
    <div
      ref="contentContainerRef"
      class="absolute inset-0 flex items-center justify-center"
      :style="{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }"
    >
      <div v-if="!imageUrl" class="p-4 text-sm text-gray-600 dark:text-gray-300">
        No PlantUML diagram to render.
      </div>
      <img
        v-else
        ref="imageRef"
        :src="imageUrl"
        alt="PlantUML diagram"
        class="block select-none"
        draggable="false"
        @load="handleImageLoad"
        @dragstart.prevent
      >
    </div>

    <!-- Zoom Controls -->
    <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        color="gray"
        @click="zoomIn"
      />
      <UButton
        icon="i-heroicons-minus"
        size="sm"
        color="gray"
        @click="zoomOut"
      />
      <UButton
        icon="i-heroicons-arrow-path"
        size="sm"
        color="gray"
        @click="resetView"
      />
    </div>

    <!-- Zoom Level Indicator -->
    <div class="absolute top-4 right-4 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300 z-10">
      {{ Math.round(scale * 100) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { encode } from 'plantuml-encoder'

interface Props {
  code: string
  backgroundColor?: string
  /**
   * Base URL of the PlantUML server.
   * Defaults to the public plantuml.com server.
   */
  serverUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: '#ffffff',
  serverUrl: 'https://www.plantuml.com/plantuml/svg'
})

const containerRef = ref<HTMLElement | null>(null)
const contentContainerRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const imageUrl = computed(() => {
  const trimmed = props.code?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  // Only build the URL on the client
  if (!import.meta.client) {
    return ''
  }

  try {
    const encoded = encode(trimmed)
    const base = props.serverUrl.replace(/\/+$/, '')
    return `${base}/${encoded}`
  } catch (error) {
    console.error('Error encoding PlantUML diagram:', error)
    return ''
  }
})

const fitToContainer = () => {
  const img = imageRef.value
  const container = containerRef.value
  if (!img || !container) {
    return
  }

  const imgWidth = img.naturalWidth || img.width
  const imgHeight = img.naturalHeight || img.height
  if (!imgWidth || !imgHeight) {
    return
  }

  const containerRect = container.getBoundingClientRect()
  const scaleX = containerRect.width / imgWidth
  const scaleY = containerRect.height / imgHeight

  const aspectRatio = imgWidth / imgHeight
  const containerAspectRatio = containerRect.width / containerRect.height

  let fitScale: number
  if (aspectRatio > containerAspectRatio) {
    fitScale = scaleX * 0.95
  } else {
    fitScale = scaleY * 0.95
  }

  const minScale = imgWidth > 2000 ? 0.5 : imgWidth > 1000 ? 0.4 : 0.3
  scale.value = Math.max(fitScale, minScale)
  position.value = { x: 0, y: 0 }
}

const handleImageLoad = async () => {
  await nextTick()
  fitToContainer()
}

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 0) {
    isDragging.value = true
    dragStart.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y
    }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    position.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y
    }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  const delta = e.deltaY * -0.001
  const newScale = Math.min(Math.max(0.1, scale.value + delta), 10)

  if (containerRef.value && contentContainerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()

    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top

    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2

    const currentCenterX = containerCenterX + position.value.x
    const currentCenterY = containerCenterY + position.value.y

    const pointInImgX = (mouseX - currentCenterX) / scale.value
    const pointInImgY = (mouseY - currentCenterY) / scale.value

    const newCenterX = mouseX - pointInImgX * newScale
    const newCenterY = mouseY - pointInImgY * newScale

    position.value = {
      x: newCenterX - containerCenterX,
      y: newCenterY - containerCenterY
    }
  }

  scale.value = newScale
}

const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 10)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.1)
}

const resetView = async () => {
  await nextTick()
  fitToContainer()
}

onMounted(() => {
  if (imageRef.value?.complete) {
    // If the image was cached and already loaded
    fitToContainer()
  }
})
</script>

<style scoped>
img {
  /* Remove intrinsic max-width so scaling is fully controlled by transforms */
  max-width: none;
}
</style>

