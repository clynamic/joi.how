export type E621File = {
  width: number
  height: number
  url: string | null
}

export type E621Posts = {
  id: number
  created_at: string
  updated_at: string
  file: { ext: string; size: number; md5: string } & E621File
  preview: E621File
  sample: { has: boolean } & E621File
  score: { up: number; down: number; total: number }
  tags: {
    general: string[]
    species: string[]
    character: string[]
    copyright: string[]
    artist: string[]
    invalid: string[]
    lore: string[]
    meta: string[]
  }
  locked_tags: string[]
  change_seq: number
  flags: { pending: boolean; flagged: boolean; note_locked: boolean; status_locked: boolean; rating_locked: boolean; deleted: boolean }
  rating: 's' | 'e'
  fav_count: number
  sources: string[]
  pools: number[]
  relationships: { parent_id: number; has_children: boolean; has_active_children: boolean; children: number[] }
  approver_id: number
  uploader_id: number
  description: string
  comment_count: number
  is_favorited: boolean
}[]
