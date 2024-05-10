import axios, { AxiosInstance } from 'axios';
import { ImageItem, ImageServiceType, ImageType } from '../types';
import {
  E621Credentials,
  E621SortOrder,
  e621SortOrderTags,
} from './E621Provider';

interface E621Post {
  id: number;
  preview: {
    url: string;
  };
  sample: {
    url: string;
  };
  file: {
    url: string;
    ext: string;
  };
}

interface E621User {
  name: string;
  blacklisted_tags: string[];
}

interface E621PostSearchResponse {
  posts: E621Post[];
}

interface E621PostSearchRequest {
  tags: string;
  limit?: number;
  order?: E621SortOrder;
  credentials?: E621Credentials;
}

export class E621Service {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://e621.net',
    });
  }

  async getImages(props: E621PostSearchRequest): Promise<ImageItem[]> {
    const { credentials, order, ...rest } = props;
    const params = {
      ...rest,
      tags: rest.tags + (order ? ' ' + e621SortOrderTags[order] : ''),
    };
    const response = await this.axiosInstance.get<E621PostSearchResponse>(
      '/posts.json',
      {
        params: params,
        auth: credentials && {
          username: credentials.username,
          password: credentials.apiKey,
        },
      }
    );

    return response.data.posts
      .map((post: E621Post) => ({
        thumbnail: post.preview.url,
        preview: post.sample.url,
        full: post.file.url,
        type: (() => {
          switch (post.file.ext) {
            case 'webm':
            case 'mp4':
              return ImageType.video;
            case 'gif':
              return ImageType.gif;
            case 'swf':
              return ImageType.flash;
            default:
              return ImageType.image;
          }
        })(),
        source: `https://e621.net/posts/${post.id}`,
        service: ImageServiceType.e621,
        id: post.id.toString(),
      }))
      .filter(post => post.type !== ImageType.flash) // Flash is not supported
      .filter(post => post.full); // deleted posts should not be included
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
    return result.data.blacklisted_tags;
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
