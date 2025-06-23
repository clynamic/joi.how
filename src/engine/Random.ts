export class Random {
  private s: number;

  constructor(seed: string) {
    this.s = Random.stringToSeed(seed);
  }

  private static stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  next(): number {
    this.s = Math.imul(48271, this.s) % 0x7fffffff;
    return (this.s & 0x7fffffff) / 0x7fffffff;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextFloatRange(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  nextBool(prob = 0.5): boolean {
    return this.next() < prob;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(arr.length)];
  }
}
