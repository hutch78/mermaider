<template>
  <div
    ref="containerRef"
    class="relative w-full h-full overflow-hidden cursor-move"
    :style="{ backgroundColor: backgroundColor }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @wheel.prevent="handleWheel"
  >
    <div
      ref="svgContainerRef"
      class="absolute inset-0 flex items-center justify-center"
      :style="{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }"
    >
      <div
        ref="mermaidRef"
        class="mermaid-container"
      />
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
interface Props {
  code: string
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: '#ffffff'
})

const containerRef = ref<HTMLElement | null>(null)
const svgContainerRef = ref<HTMLElement | null>(null)
const mermaidRef = ref<HTMLElement | null>(null)

const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const mermaidLoaded = ref(false)

// Load mermaid dynamically on client side
let mermaid: typeof import('mermaid').default | null = null

onMounted(async () => {
  if (import.meta.client) {
    mermaid = (await import('mermaid')).default
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      },
      sequence: {
        useMaxWidth: false,
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        rightAngles: false,
        showSequenceNumbers: false
      }
    })
    mermaidLoaded.value = true
    renderMermaid()
  }
})

const renderMermaid = async () => {
  if (!mermaidRef.value || !props.code.trim() || !mermaid) {
    return
  }

  try {
    // Clear previous content
    mermaidRef.value.innerHTML = ''
    
    // Generate unique ID for this diagram
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Render the diagram
    const { svg } = await mermaid.render(id, props.code)
    mermaidRef.value.innerHTML = svg
    
    // Calculate initial scale based on SVG size vs container size
    await nextTick()
    const svgElement = mermaidRef.value.querySelector('svg') as SVGSVGElement | null
    if (svgElement && containerRef.value) {
      // Get SVG dimensions from viewBox or width/height attributes
      const viewBox = svgElement.viewBox.baseVal
      let svgWidth = viewBox.width || svgElement.width.baseVal.value
      let svgHeight = viewBox.height || svgElement.height.baseVal.value
      
      // Fallback to getBoundingClientRect if viewBox/attributes aren't available
      if (!svgWidth || !svgHeight || svgWidth === 0 || svgHeight === 0) {
        const rect = svgElement.getBoundingClientRect()
        svgWidth = rect.width || viewBox.width
        svgHeight = rect.height || viewBox.height
      }
      
      const containerRect = containerRef.value.getBoundingClientRect()
      
      // Calculate scale to fit
      const scaleX = containerRect.width / svgWidth
      const scaleY = containerRect.height / svgHeight
      
      // For very wide diagrams (sequence diagrams), prioritize fitting width
      // For tall diagrams, prioritize fitting height
      const aspectRatio = svgWidth / svgHeight
      const containerAspectRatio = containerRect.width / containerRect.height
      
      let fitScale: number
      if (aspectRatio > containerAspectRatio) {
        // Diagram is wider relative to container - fit to width
        fitScale = scaleX * 0.95
      } else {
        // Diagram is taller relative to container - fit to height
        fitScale = scaleY * 0.95
      }
      
      // Set minimum scale based on diagram size - larger diagrams get higher minimum
      const minScale = svgWidth > 2000 ? 0.5 : svgWidth > 1000 ? 0.4 : 0.3
      
      // Set initial scale
      scale.value = Math.max(fitScale, minScale)
    }
    
    // Reset position but keep calculated scale
    position.value = { x: 0, y: 0 }
  } catch (error) {
    console.error('Error rendering mermaid diagram:', error)
    if (mermaidRef.value) {
      mermaidRef.value.innerHTML = `<div class="p-4 text-red-500">Error: ${error instanceof Error ? error.message : 'Failed to render diagram'}</div>`
    }
  }
}

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 0) { // Left mouse button
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
  // Increase max zoom to 10x for very large diagrams
  const newScale = Math.min(Math.max(0.1, scale.value + delta), 10)
  
  // Zoom towards mouse position
  if (containerRef.value && svgContainerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()
    
    // Mouse position relative to container
    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top
    
    // Container center
    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2
    
    // Current position of the SVG container center relative to container
    const currentCenterX = containerCenterX + position.value.x
    const currentCenterY = containerCenterY + position.value.y
    
    // Point in the scaled/translated coordinate space that's under the cursor
    // This is the point in the SVG's local coordinate space
    const pointInSvgX = (mouseX - currentCenterX) / scale.value
    const pointInSvgY = (mouseY - currentCenterY) / scale.value
    
    // After scaling, we want the same point to be under the cursor
    // So the new center position should be:
    const newCenterX = mouseX - pointInSvgX * newScale
    const newCenterY = mouseY - pointInSvgY * newScale
    
    // Update position (relative to container center)
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
  // Calculate fit-to-container scale
  if (mermaidRef.value && containerRef.value) {
    const svgElement = mermaidRef.value.querySelector('svg') as SVGSVGElement | null
    if (svgElement) {
      await nextTick()
      // Get SVG dimensions from viewBox or width/height attributes
      const viewBox = svgElement.viewBox.baseVal
      let svgWidth = viewBox.width || svgElement.width.baseVal.value
      let svgHeight = viewBox.height || svgElement.height.baseVal.value
      
      // Fallback to getBoundingClientRect if viewBox/attributes aren't available
      if (!svgWidth || !svgHeight || svgWidth === 0 || svgHeight === 0) {
        const rect = svgElement.getBoundingClientRect()
        svgWidth = rect.width || viewBox.width
        svgHeight = rect.height || viewBox.height
      }
      
      const containerRect = containerRef.value.getBoundingClientRect()
      
      // Calculate scale to fit
      const scaleX = containerRect.width / svgWidth
      const scaleY = containerRect.height / svgHeight
      
      // For very wide diagrams (sequence diagrams), prioritize fitting width
      const aspectRatio = svgWidth / svgHeight
      const containerAspectRatio = containerRect.width / containerRect.height
      
      let fitScale: number
      if (aspectRatio > containerAspectRatio) {
        // Diagram is wider relative to container - fit to width
        fitScale = scaleX * 0.95
      } else {
        // Diagram is taller relative to container - fit to height
        fitScale = scaleY * 0.95
      }
      
      // Set minimum scale based on diagram size
      const minScale = svgWidth > 2000 ? 0.5 : svgWidth > 1000 ? 0.4 : 0.3
      
      scale.value = Math.max(fitScale, minScale)
    } else {
      scale.value = 1
    }
  } else {
    scale.value = 1
  }
  position.value = { x: 0, y: 0 }
}

// Watch for code changes and re-render
watch(() => props.code, () => {
  if (mermaidLoaded.value) {
    renderMermaid()
  }
})
</script>

<style scoped>
.mermaid-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mermaid-container :deep(svg) {
  display: block;
  /* Remove max-width constraint to allow large diagrams to render at full size */
}
</style>

