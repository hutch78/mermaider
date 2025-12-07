export type SnippetType = 'mermaid' | 'plantuml'

export interface Snippet {
  id: string
  title: string
  code: string
  type: SnippetType
  createdAt: number // timestamp
}

export interface SnippetAdapter {
  save(snippet: Snippet): Promise<void>
  getAll(): Promise<Snippet[]>
  getById(id: string): Promise<Snippet | null>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}
