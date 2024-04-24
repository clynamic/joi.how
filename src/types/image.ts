export enum ImageType {
  image,
  video,
  gif,
  flash,
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
  e621,
}
