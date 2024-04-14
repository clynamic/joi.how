export type ArrayElement<A> = A extends ReadonlyArray<infer T> ? T : never

export enum EStroke {
  up,
  down,
}

export enum EGrip {
  left,
  right,
  both,
  none,
}

export enum PornService {
    E621,
    WALLTAKER,
    REDGIFS
}

export interface Credentials {
  [PornService.E621]?: E621Credentials | undefined,
  [PornService.WALLTAKER]?: undefined,
  [PornService.REDGIFS]?: RedGifsCredentials | undefined
}

interface E621Credentials {
  username: string
  password: string
}

interface RedGifsCredentials {
  authToken: string
}

export enum PornType {
    IMAGE,
    VIDEO,
    GIF
}

export enum PornQuality {
    HIGH,
    LOW
}

export interface PornItem {
    previewUrl: string;
    hoverPreviewUrl: string;
    mainUrl: string;
    highResUrl: string;
    type: PornType;
    source: string;
    service: PornService;
    uniqueId: string;
}

export type PornList = PornItem[]

export interface EventToken {
  id: string
  name: string
  description: string
}

export enum HypnoMode {
  Off,
  JOI,
  Breeding,
  Pet,
  FemDomPet,
}

export enum PlayerGender {
  Female,
  Male,
  Neutral,
}

export enum PlayerParts {
  Cock,
  Pussy,
  Neuter,
}
