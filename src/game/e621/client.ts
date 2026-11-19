import axios, { AxiosInstance } from 'axios';
import { ImageItem, ImageServiceType, ImageType } from '../assets';
import { Blacklist } from './blacklist';

export interface E621Credentials {
  username: string;
  apiKey: string;
}

export enum E621SortOrder {
  Id = 'id',
  Random = 'random',
  Favourites = 'favourites',
  Comments = 'comments',
  Score = 'score',
}

export const e621SortOrderLabels: Record<E621SortOrder, string> = {
  [E621SortOrder.Id]: 'ID',
  [E621SortOrder.Random]: 'Random',
  [E621SortOrder.Favourites]: 'Favourites',
  [E621SortOrder.Comments]: 'Comments',
  [E621SortOrder.Score]: 'Score',
};

export const e621SortOrderTags: Record<E621SortOrder, string> = {
  [E621SortOrder.Id]: 'order:id_desc',
  [E621SortOrder.Random]: 'order:random',
  [E621SortOrder.Favourites]: 'order:favcount',
  [E621SortOrder.Comments]: 'order:comment_count',
  [E621SortOrder.Score]: 'order:score',
};

export interface E621Post {
  id: number;
  files: {
    meta: {
      ext: string;
      has_sample: boolean;
    };
    original: {
      url: string | null;
      height: number;
      width: number;
    };
    preview: {
      jpg: string | null;
    };
    sample: {
      jpg: string | null;
    };
  };
  tags: string[];
  stats: {
    score: {
      total: number;
    };
    is_favorited: boolean;
  };
  rating: 's' | 'q' | 'e';
  uploader_id: number;
}

export interface E621User {
  name: string;
  blacklisted_tags: string;
}

interface E621PostSearchRequest {
  tags: string;
  limit?: number;
  order?: E621SortOrder;
  score?: number;
  credentials?: E621Credentials;
  blacklist?: string[];
}

export class E621Service {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://e621.net',
    });
  }

  async getImages(props: E621PostSearchRequest): Promise<ImageItem[]> {
    const { credentials, order, score: minScore, tags, ...rest } = props;
    const params = {
      ...rest,
      tags: [
        ...tags.split(' ').filter(tag => tag),
        order ? ' ' + e621SortOrderTags[order] : '',
        minScore ? ` score:>=${minScore}` : '',
      ].join(' '),
    };
    const response = await this.axiosInstance.get<E621Post[]>('/posts.json', {
      params: params,
      auth: credentials && {
        username: credentials.username,
        password: credentials.apiKey,
      },
    });

    const blacklistEntries = Blacklist.entriesParse(props.blacklist || []);

    const isVideo = (ext: string) => ext === 'webm' || ext === 'mp4';

    return response.data
      .filter(post => post.files.original.url) // deleted posts should not be included
      .filter(post => post.files.meta.ext !== 'swf') // Flash is not supported
      .filter(post =>
        blacklistEntries.every(entry => !Blacklist.postMatch(post, entry))
      ) // Blacklisted posts should not be included
      .map(post => ({
        thumbnail:
          post.files.preview.jpg ??
          post.files.sample.jpg ??
          post.files.original.url!,
        preview:
          (post.files.meta.has_sample ? post.files.sample.jpg : null) ??
          (isVideo(post.files.meta.ext) ? post.files.preview.jpg : null) ??
          post.files.original.url!,
        full: post.files.original.url!,
        type: (() => {
          switch (post.files.meta.ext) {
            case 'webm':
            case 'mp4':
              return ImageType.video;
            case 'gif':
              return ImageType.gif;
            default:
              return ImageType.image;
          }
        })(),
        source: `https://e621.net/posts/${post.id}`,
        service: ImageServiceType.e621,
        id: post.id.toString(),
      }));
  }

  async getBlacklist(credentials: E621Credentials): Promise<string[]> {
    const result = await this.axiosInstance.get<E621User>(
      `/users/${encodeURIComponent(credentials.username)}.json`,
      {
        auth: {
          username: credentials.username,
          password: credentials.apiKey,
        },
      }
    );
    return result.data.blacklisted_tags
      .split('\n')
      .map(tag => tag.trim())
      .filter(tag => tag);
  }

  async testCredentials(credentials: E621Credentials): Promise<boolean> {
    try {
      await this.axiosInstance.get(
        `/users/${encodeURIComponent(credentials.username)}.json`,
        {
          auth: {
            username: credentials.username,
            password: credentials.apiKey,
          },
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
