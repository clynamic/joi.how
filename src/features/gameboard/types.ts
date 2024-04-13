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

export interface Credentials {
  username: string
  password: string
}

export enum PornType {
    IMAGE,
    VIDEO,
    GIF
}

export enum PornService {
    E621,
    WALLTAKER
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
