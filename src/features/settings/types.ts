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

export enum E621SortOrder {
  Id = 'order:id_desc',
  Random = 'order:random',
  VideoDurationLongest = 'order:duration',
  VideoDurationShortest = 'order:duration_asc',
  MostFavourites = 'order:favcount',
  MostComments = 'order:comment_count',
  HighestScore = 'order:score',
  LowestScore = 'order:score_desc',
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

export enum RedGifsSortOrder {
  BEST = 'best',
  LATEST = 'latest',
  OLDEST = 'oldest',
  TRENDING = 'trending',
  TOP7 = 'top7',
  TOP28 = 'top28',
}

export enum RedGifsSexuality {
  ANY = 'any',
  GAY = 'gay',
  STRAIGHT = 'straight',
  TRANS = 'trans',
  LESBIAN = 'lesbian',
  BISEXUAL = 'bisexual',
}

export interface RedGifsSearchResponse {
  page: number;
  pages: number;
  total: number;
  gifs: RedGifsGIF[];
  users: RedGifsUser[];
  niches: RedGifsNich[];
  tags: string[];
}

export interface RedGifsGIF {
  avgColor: string;
  createDate: number;
  description: null | string;
  duration: number | null;
  gallery: null;
  hasAudio: boolean;
  height: number;
  hideHome: boolean;
  hideTrending: boolean;
  hls: boolean;
  id: string;
  likes: number;
  niches: string[];
  published: boolean;
  tags: string[];
  type: number;
  urls: {
    sd: string;
    hd: string;
    poster: string;
    thumbnail: string;
    vthumbnail: string;
  };
  userName: string;
  verified: boolean;
  views: number;
  width: number;
  sexuality: Array<RedGifsSexuality>;
}

export interface RedGifsNich {
  cover: null | string;
  description: string;
  gifs: number;
  id: string;
  name: string;
  owner: string;
  subscribers: number;
  thumbnail: string;
}

export interface RedGifsUser {
  creationtime: number;
  description: null | string;
  followers: number;
  following: number;
  gifs: number;
  name: null | string;
  profileImageUrl: null | string;
  profileUrl: string;
  publishedCollections: number;
  publishedGifs: number;
  status: "active";
  subscription: number;
  url: string;
  username: string;
  verified: boolean;
  views: number;
  poster: string;
  preview: string;
  thumbnail: string;
  likes: number;
  socialUrl1?: null | string;
  socialUrl2?: string;
  socialUrl3?: null | string;
  socialUrl4?: null | string;
  socialUrl5?: null | string;
  socialUrl6?: string;
  socialUrl7?: null;
  socialUrl8?: null;
  socialUrl9?: null | string;
  socialUrl10?: null;
  socialUrl11?: null;
  socialUrl12?: null;
  socialUrl13?: null;
  socialUrl14?: null;
  socialUrl15?: null;
  socialUrl16?: null;
  links?: Array<{
    domain: string;
    url: string;
  }>;
}