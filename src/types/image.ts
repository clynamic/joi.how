export enum ImageType {
  image = 'image',
  video = 'video',
  gif = 'gif',
}

export enum ImageSize {
  thumbnail = 'thumbnail',
  preview = 'preview',
  full = 'full',
}

export interface ImageItem {
  thumbnail: string;
  preview: string;
  full: string;
  type: ImageType;
  source: string;
  service: ImageServiceType;
  id: string;
}

export enum ImageServiceType {
  e621 = 'e621',
  local = 'local',
}
