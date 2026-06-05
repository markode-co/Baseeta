declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic(value: string): string;
    convertArabicBack(value: string): string;
  };
  export const PersianShaper: {
    convertArabic(value: string): string;
    convertArabicBack(value: string): string;
  };
}

declare module "bidi-js" {
  export type BidiDirection = "rtl" | "ltr";
  export interface BidiFactory {
    getEmbeddingLevels(value: string, direction: BidiDirection): number[];
    getMirroredCharactersMap(value: string, levels: number[]): Map<number, string | undefined>;
    getReorderSegments(value: string, levels: number[]): Array<[number, number]>;
  }
  const createBidi: () => BidiFactory;
  export default createBidi;
}

