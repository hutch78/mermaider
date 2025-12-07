import type { Snippet, SnippetType, SnippetAdapter } from '~/types/snippet'
import { LocalStorageAdapter } from './adapters/localStorageAdapter'

/**
 * Generates a title for a snippet based on its type and creation time
 */
function generateSnippetTitle(type: SnippetType, createdAt: number): string {
  const date = new Date(createdAt)
  const dateStr = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const typeLabel = type === 'mermaid' ? 'Mermaid' : 'PlantUML'
  return `${typeLabel} - ${dateStr}`
}

/**
 * Detects the snippet type from code
 */
function detectSnippetType(code: string): SnippetType {
  const text = code?.trim() ?? ''
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

  // Default to Mermaid
  return 'mermaid'
}

export function useSnippetPersistence(adapter?: SnippetAdapter) {
  const storageAdapter = adapter || new LocalStorageAdapter()

  /**
   * Saves a snippet with auto-generated title
   */
  const saveSnippet = async (code: string, createdAt?: number): Promise<Snippet> => {
    const timestamp = createdAt || Date.now()
    const type = detectSnippetType(code)
    const title = generateSnippetTitle(type, timestamp)
    const id = `snippet-${timestamp}-${Math.random().toString(36).substr(2, 9)}`

    const snippet: Snippet = {
      id,
      title,
      code,
      type,
      createdAt: timestamp
    }

    await storageAdapter.save(snippet)
    return snippet
  }

  /**
   * Gets all saved snippets
   */
  const getAllSnippets = async (): Promise<Snippet[]> => {
    return await storageAdapter.getAll()
  }

  /**
   * Gets a snippet by ID
   */
  const getSnippetById = async (id: string): Promise<Snippet | null> => {
    return await storageAdapter.getById(id)
  }

  /**
   * Deletes a snippet
   */
  const deleteSnippet = async (id: string): Promise<void> => {
    await storageAdapter.delete(id)
  }

  /**
   * Clears all snippets
   */
  const clearAllSnippets = async (): Promise<void> => {
    await storageAdapter.clear()
  }

  return {
    saveSnippet,
    getAllSnippets,
    getSnippetById,
    deleteSnippet,
    clearAllSnippets
  }
}
