export interface E621File {
  width: number
  height: number
  url: string | null
}

export interface E621FileWithTypeAndMultipleUrls extends E621File {
  type: "video"
  url: never
  urls: Array<string | null>
}

export interface E621Post {
  id: number
  created_at: string
  updated_at: string
  file: { ext: string; size: number; md5: string } & E621File
  preview: E621File
  sample: { has: boolean, alternates?: Record<string, E621FileWithTypeAndMultipleUrls> } & E621File
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
  rating: 's' | 'q' | 'e'
  fav_count: number
  sources: string[]
  pools: number[]
  relationships: { parent_id: number; has_children: boolean; has_active_children: boolean; children: number[] }
  approver_id: number
  uploader_id: number
  description: string
  comment_count: number
  is_favorited: boolean
}

export interface E621User {
  api_burst_limit: number
  api_regen_multiplier: number
  artist_version_count: number
  avatar_id: number
  base_upload_limit: number
  blacklist_avatars: boolean
  blacklist_users: boolean
  blacklisted_tags: string
  can_approve_posts: boolean
  can_upload_free: boolean
  comment_count: number
  comment_threshold: number
  created_at: string
  custom_style: string
  default_image_size: string
  description_collapsed_initially: boolean
  disable_cropped_thumbnails: boolean
  disable_mobile_gestures: boolean
  disable_post_tooltips: boolean
  disable_responsive_mode: boolean
  disable_user_dmails: boolean
  email: string
  enable_auto_complete: boolean
  enable_compact_uploader: boolean
  enable_keyboard_navigation: boolean
  enable_privacy_mode: boolean
  enable_safe_mode: boolean
  favorite_count: number
  favorite_limit: number
  favorite_tags: string
  flag_count: number
  forum_post_count: number
  has_mail: boolean
  has_saved_searches: boolean
  hide_comments: boolean
  id: number
  is_banned: boolean
  last_forum_read_at: string
  last_logged_in_at: string
  level: number
  level_string: string
  name: string
  negative_feedback_count: number
  neutral_feedback_count: number
  no_feedback: boolean
  no_flagging: boolean
  note_update_count: number
  per_page: number
  pool_version_count: number
  positive_feedback_count: number
  post_update_count: number
  post_upload_count: number
  receive_email_notifications: boolean
  recent_tags: string
  remaining_api_limit: number
  replacements_beta: boolean
  show_avatars: boolean
  show_hidden_comments: boolean
  show_post_statistics: boolean
  statement_timeout: number
  style_usernames: boolean
  tag_query_limit: number
  time_zone: string
  updated_at: string
  upload_limit: number
  wiki_page_version_count: number
}
