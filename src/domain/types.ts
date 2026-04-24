// Canonical domain types. familyStore re-exports from here so the UI
// layer only needs to import from "domain/types".
export type Gender = "m" | "f" | "other" | "unknown";

export type FuzzyDate =
  | { kind: "exact"; y: number; m?: number; d?: number }
  | { kind: "year"; y: number }
  | {
      kind: "era";
      era: "明治" | "大正" | "昭和" | "平成" | "令和";
      year: number;
      m?: number;
      d?: number;
    }
  | { kind: "unknown" };

export type PersonId = string;
export type UnionId = string;
export type MemoryId = string;
export type PhotoId = string;

export interface Person {
  id: PersonId;
  surname: string;
  given: string;
  kanaSurname?: string;
  kanaGiven?: string;
  maidenName?: string;
  gender: Gender;
  birth?: FuzzyDate;
  death?: FuzzyDate;
  birthPlace?: string;
  note?: string;
  role?: string;
  deceased?: boolean;
  portrait?: PhotoId;
}

export interface Union {
  id: UnionId;
  partnerA: PersonId;
  partnerB: PersonId;
}

export interface ParentChildLink {
  parentUnion?: UnionId;
  parentId?: PersonId;
  childId: PersonId;
}

export interface Memory {
  id: MemoryId;
  title: string;
  protagonistId?: PersonId;
  authorId: PersonId;
  periodLabel: string;
  body: string;
  viewers: PersonId[];
  related: PersonId[];
  tags: string[];
  photos: number;
  photoIds?: PhotoId[];
  heroPhotoId?: PhotoId;
  locked?: boolean;
  year: string;
  era?: string;
}

export interface Family {
  id: string;
  name: string;
  theme: "picture-book" | "scroll" | "modern";
  themeColor: string;
  rootPersonId: PersonId;
  people: Record<PersonId, Person>;
  unions: Union[];
  links: ParentChildLink[];
  memories: Record<MemoryId, Memory>;
  generations: number;
  lastUpdated: string;
}
