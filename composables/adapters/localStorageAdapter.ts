import type { Snippet, SnippetAdapter } from '~/types/snippet'

export class LocalStorageAdapter implements SnippetAdapter {
  private readonly storageKey = 'mermaider-snippets'

  async save(snippet: Snippet): Promise<void> {
    if (!import.meta.client) {
      return
    }

    const snippets = await this.getAll()
    const existingIndex = snippets.findIndex((s) => s.id === snippet.id)

    if (existingIndex >= 0) {
      snippets[existingIndex] = snippet
    } else {
      snippets.push(snippet)
    }

    // Sort by createdAt descending (newest first)
    snippets.sort((a, b) => b.createdAt - a.createdAt)

    localStorage.setItem(this.storageKey, JSON.stringify(snippets))
  }

  async getAll(): Promise<Snippet[]> {
    if (!import.meta.client) {
      return []
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return []
      }

      const snippets = JSON.parse(stored) as Snippet[]
      // Validate and filter out invalid snippets
      return snippets.filter(
        (s) =>
          s &&
          typeof s.id === 'string' &&
          typeof s.title === 'string' &&
          typeof s.code === 'string' &&
          typeof s.type === 'string' &&
          typeof s.createdAt === 'number'
      )
    } catch (error) {
      console.error('Error reading snippets from localStorage:', error)
      return []
    }
  }

  async getById(id: string): Promise<Snippet | null> {
    const snippets = await this.getAll()
    return snippets.find((s) => s.id === id) || null
  }

  async delete(id: string): Promise<void> {
    if (!import.meta.client) {
      return
    }

    const snippets = await this.getAll()
    const filtered = snippets.filter((s) => s.id !== id)
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
  }

  async clear(): Promise<void> {
    if (!import.meta.client) {
      return
    }

    localStorage.removeItem(this.storageKey)
  }
}
