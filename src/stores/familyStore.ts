// State that drives every screen. Persists across reloads via a
// custom Zustand storage that writes to the A/B slot helper (see
// src/storage/localStoreAB.ts).
//
// Photos are NOT serialised here; they live in IndexedDB (see
// src/storage/idb.ts) and are referenced by `portrait` / `photoIds`.
import { create } from "zustand";
import { persist, StateStorage } from "zustand/middleware";
import { loadLatest, saveAB, clearAB } from "../storage/localStoreAB";
import {
  Family,
  FuzzyDate,
  Gender,
  Memory,
  ParentChildLink,
  Person,
  PersonId,
  Union,
} from "../domain/types";

// Re-export for existing imports across pages/modals.
export type { Family, FuzzyDate, Gender, Memory, ParentChildLink, Person, PersonId, Union };

const ROOT_KEY = "ft2.state.v1";

// ── Sample data (used the first time the app boots) ───────────────

const yamada: Family = {
  id: "yamada",
  name: "山田家",
  theme: "picture-book",
  themeColor: "#E8B8B2",
  rootPersonId: "p_sho",
  generations: 4,
  lastUpdated: "昨日",
  people: {
    p_taichi: {
      id: "p_taichi",
      surname: "山田",
      given: "太一",
      kanaSurname: "やまだ",
      kanaGiven: "たいち",
      gender: "m",
      birth: { kind: "year", y: 1932 },
      death: { kind: "year", y: 2015 },
      role: "曽祖父",
      deceased: true,
    },
    p_fuji: {
      id: "p_fuji",
      surname: "山田",
      given: "ふじ",
      kanaSurname: "やまだ",
      kanaGiven: "ふじ",
      gender: "f",
      birth: { kind: "year", y: 1936 },
      death: { kind: "year", y: 2020 },
      role: "曽祖母",
      deceased: true,
    },
    p_jiro: {
      id: "p_jiro",
      surname: "山田",
      given: "次郎",
      gender: "m",
      birth: { kind: "year", y: 1956 },
      role: "祖父",
    },
    p_haruko: {
      id: "p_haruko",
      surname: "山田",
      given: "春子",
      kanaSurname: "やまだ",
      kanaGiven: "はるこ",
      gender: "f",
      birth: { kind: "era", era: "昭和", year: 35, m: 4, d: 12 },
      role: "大叔母",
      birthPlace: "東京都・新宿区",
      note: "短歌が好き。庭に四季の花を絶やさない家。",
    },
    p_saburo: {
      id: "p_saburo",
      surname: "山田",
      given: "三郎",
      gender: "m",
      birth: { kind: "year", y: 1963 },
      role: "大叔父",
    },
    p_yoko: {
      id: "p_yoko",
      surname: "鈴木",
      given: "洋子",
      gender: "f",
      birth: { kind: "year", y: 1965 },
      role: "配偶者",
    },
    p_sho: {
      id: "p_sho",
      surname: "山田",
      given: "翔",
      gender: "m",
      birth: { kind: "year", y: 1992 },
      role: "父",
    },
    p_maho: {
      id: "p_maho",
      surname: "山田",
      given: "真帆",
      gender: "f",
      birth: { kind: "year", y: 1994 },
      role: "母",
    },
  },
  unions: [
    { id: "u_taichi_fuji", partnerA: "p_taichi", partnerB: "p_fuji" },
    { id: "u_saburo_yoko", partnerA: "p_saburo", partnerB: "p_yoko" },
  ],
  links: [
    { parentUnion: "u_taichi_fuji", childId: "p_jiro" },
    { parentUnion: "u_taichi_fuji", childId: "p_haruko" },
    { parentUnion: "u_taichi_fuji", childId: "p_saburo" },
    { parentUnion: "u_saburo_yoko", childId: "p_sho" },
  ],
  memories: {
    m_house: {
      id: "m_house",
      title: "庭付きの家へ",
      protagonistId: "p_haruko",
      authorId: "p_sho",
      periodLabel: "2020年（令和2年）ごろ",
      year: "2020",
      era: "令和2",
      body: "庭の梅の木は、お祖母さまが植えたものだという。引越した日、一番先にその木を見に行った。",
      viewers: ["p_sho", "p_haruko", "p_maho"],
      related: ["p_haruko", "p_sho"],
      tags: ["庭", "引越し"],
      photos: 5,
    },
    m_rose: {
      id: "m_rose",
      title: "春の花が咲いた年",
      protagonistId: "p_haruko",
      authorId: "p_sho",
      periodLabel: "1995年（平成7年）ごろ",
      year: "1995",
      era: "平成7",
      body: "はじめての土いじり。祖母と二人で植えた薔薇が、その年の春に咲いた。",
      viewers: ["p_sho", "p_haruko", "p_maho"],
      related: ["p_haruko", "p_sho", "p_fuji"],
      tags: ["庭", "薔薇", "子ども時代"],
      photos: 3,
      locked: true,
    },
    m_wedding: {
      id: "m_wedding",
      title: "結婚式の日",
      protagonistId: "p_haruko",
      authorId: "p_haruko",
      periodLabel: "1988年（昭和63年）秋",
      year: "1988",
      era: "昭和63",
      body: "秋晴れの日だった。親族だけの小さな式だったけれど、父が涙ぐんでいたのを覚えている。",
      viewers: ["p_sho", "p_haruko", "p_maho"],
      related: ["p_haruko"],
      tags: ["結婚"],
      photos: 8,
    },
  },
};

const suzuki: Family = {
  id: "suzuki",
  name: "鈴木家",
  theme: "picture-book",
  themeColor: "#C8D4B8",
  rootPersonId: "p_ichiro",
  generations: 5,
  lastUpdated: "3日前",
  people: {
    p_ichiro: {
      id: "p_ichiro",
      surname: "鈴木",
      given: "一郎",
      gender: "m",
      birth: { kind: "year", y: 1938 },
      role: "祖父",
    },
  },
  unions: [],
  links: [],
  memories: {},
};

const sato: Family = {
  id: "sato",
  name: "佐藤家・母方",
  theme: "picture-book",
  themeColor: "#E8DFA0",
  rootPersonId: "p_ume",
  generations: 3,
  lastUpdated: "先月",
  people: {
    p_ume: {
      id: "p_ume",
      surname: "佐藤",
      given: "梅",
      gender: "f",
      birth: { kind: "era", era: "大正", year: 12 },
      role: "祖母",
    },
  },
  unions: [],
  links: [],
  memories: {},
};

// ── Store shape ────────────────────────────────────────────────────
interface FamilyStoreShape {
  families: Record<string, Family>;
  activeFamilyId: string;
  currentViewerPersonId: string;
  dirty: boolean;
  toast?: { tone: "ok" | "warn" | "err"; text: string; id: number };
  reminderEnabled: boolean;
  reminderShownAt?: number; // epoch ms of last reminder shown
  lastExportAt?: number;
  theme: "picture-book" | "scroll" | "modern";
  persistGranted: boolean;
  storageEstimate?: { used: number; total: number };

  getFamily: (id?: string) => Family | undefined;

  addFamily: (f: Family) => void;
  setActiveFamily: (id: string) => void;
  renameFamily: (id: string, name: string) => void;
  deleteFamily: (id: string) => void;
  replaceFamilies: (fams: Record<string, Family>) => void;

  addPerson: (familyId: string, p: Person) => void;
  patchPerson: (familyId: string, pid: string, patch: Partial<Person>) => void;
  removePerson: (familyId: string, pid: string) => void;

  addUnion: (familyId: string, u: Union) => void;
  removeUnion: (familyId: string, unionId: string) => void;
  addParentChildLink: (familyId: string, l: ParentChildLink) => void;
  removeParentChildLink: (
    familyId: string,
    predicate: (l: ParentChildLink) => boolean,
  ) => void;

  addMemory: (familyId: string, m: Memory) => void;
  patchMemory: (familyId: string, mid: string, patch: Partial<Memory>) => void;
  removeMemory: (familyId: string, mid: string) => void;

  showToast: (tone: "ok" | "warn" | "err", text: string) => void;
  clearToast: () => void;
  markDirty: () => void;
  markClean: () => void;
  setReminder: (on: boolean) => void;
  touchReminder: () => void;
  setLastExport: () => void;
  setTheme: (t: "picture-book" | "scroll" | "modern") => void;
  setPersistGranted: (v: boolean) => void;
  setStorageEstimate: (e: { used: number; total: number } | undefined) => void;
  wipe: () => void;
}

// ── Custom Zustand storage: delegates to localStoreAB ─────────────
const abStorage: StateStorage = {
  getItem: (_k) => {
    const v = loadLatest<string>(ROOT_KEY);
    return v ?? null;
  },
  setItem: (_k, v) => {
    saveAB(ROOT_KEY, v);
  },
  removeItem: (_k) => clearAB(ROOT_KEY),
};

export const useFamilyStore = create<FamilyStoreShape>()(
  persist(
    (set, get) => ({
      families: { yamada, suzuki, sato },
      activeFamilyId: "yamada",
      currentViewerPersonId: "p_sho",
      dirty: false,
      reminderEnabled: true,
      theme: "picture-book",
      persistGranted: false,

      getFamily: (id) => {
        const fid = id ?? get().activeFamilyId;
        return get().families[fid];
      },

      addFamily: (f) =>
        set((s) => ({
          families: { ...s.families, [f.id]: f },
          activeFamilyId: f.id,
          dirty: true,
        })),
      setActiveFamily: (id) => set({ activeFamilyId: id }),
      renameFamily: (id, name) =>
        set((s) => ({
          families: { ...s.families, [id]: { ...s.families[id], name } },
          dirty: true,
        })),
      deleteFamily: (id) =>
        set((s) => {
          const next = { ...s.families };
          delete next[id];
          const first = Object.keys(next)[0] ?? "";
          return {
            families: next,
            activeFamilyId: s.activeFamilyId === id ? first : s.activeFamilyId,
            dirty: true,
          };
        }),
      replaceFamilies: (fams) =>
        set((s) => ({
          families: fams,
          activeFamilyId:
            s.activeFamilyId && fams[s.activeFamilyId]
              ? s.activeFamilyId
              : Object.keys(fams)[0] ?? "",
          dirty: true,
        })),

      addPerson: (familyId, p) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          return {
            families: {
              ...s.families,
              [familyId]: { ...fam, people: { ...fam.people, [p.id]: p } },
            },
            dirty: true,
          };
        }),
      patchPerson: (familyId, pid, patch) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam || !fam.people[pid]) return s;
          return {
            families: {
              ...s.families,
              [familyId]: {
                ...fam,
                people: {
                  ...fam.people,
                  [pid]: { ...fam.people[pid], ...patch },
                },
              },
            },
            dirty: true,
          };
        }),
      removePerson: (familyId, pid) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          const next = { ...fam.people };
          delete next[pid];
          return {
            families: {
              ...s.families,
              [familyId]: {
                ...fam,
                people: next,
                unions: fam.unions.filter(
                  (u) => u.partnerA !== pid && u.partnerB !== pid,
                ),
                links: fam.links.filter(
                  (l) => l.childId !== pid && l.parentId !== pid,
                ),
              },
            },
            dirty: true,
          };
        }),

      addUnion: (familyId, u) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          return {
            families: {
              ...s.families,
              [familyId]: { ...fam, unions: [...fam.unions, u] },
            },
            dirty: true,
          };
        }),
      removeUnion: (familyId, unionId) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          return {
            families: {
              ...s.families,
              [familyId]: {
                ...fam,
                unions: fam.unions.filter((u) => u.id !== unionId),
                // children whose parent-link was this union lose the link.
                links: fam.links.filter((l) => l.parentUnion !== unionId),
              },
            },
            dirty: true,
          };
        }),
      addParentChildLink: (familyId, l) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          return {
            families: {
              ...s.families,
              [familyId]: { ...fam, links: [...fam.links, l] },
            },
            dirty: true,
          };
        }),
      removeParentChildLink: (familyId, predicate) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          return {
            families: {
              ...s.families,
              [familyId]: {
                ...fam,
                links: fam.links.filter((l) => !predicate(l)),
              },
            },
            dirty: true,
          };
        }),

      addMemory: (familyId, m) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          return {
            families: {
              ...s.families,
              [familyId]: { ...fam, memories: { ...fam.memories, [m.id]: m } },
            },
            dirty: true,
          };
        }),
      patchMemory: (familyId, mid, patch) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam || !fam.memories[mid]) return s;
          return {
            families: {
              ...s.families,
              [familyId]: {
                ...fam,
                memories: {
                  ...fam.memories,
                  [mid]: { ...fam.memories[mid], ...patch },
                },
              },
            },
            dirty: true,
          };
        }),
      removeMemory: (familyId, mid) =>
        set((s) => {
          const fam = s.families[familyId];
          if (!fam) return s;
          const next = { ...fam.memories };
          delete next[mid];
          return {
            families: {
              ...s.families,
              [familyId]: { ...fam, memories: next },
            },
            dirty: true,
          };
        }),

      showToast: (tone, text) => {
        const id = Date.now();
        set({ toast: { tone, text, id } });
        setTimeout(() => {
          if (get().toast?.id === id) set({ toast: undefined });
        }, 2800);
      },
      clearToast: () => set({ toast: undefined }),
      markDirty: () => set({ dirty: true }),
      markClean: () => set({ dirty: false }),
      setReminder: (on) => set({ reminderEnabled: on }),
      touchReminder: () => set({ reminderShownAt: Date.now() }),
      setLastExport: () => set({ lastExportAt: Date.now() }),
      setTheme: (t) => set({ theme: t }),
      setPersistGranted: (v) => set({ persistGranted: v }),
      setStorageEstimate: (e) => set({ storageEstimate: e }),
      wipe: () => {
        clearAB(ROOT_KEY);
        set({
          families: { yamada, suzuki, sato },
          activeFamilyId: "yamada",
          currentViewerPersonId: "p_sho",
          dirty: false,
          reminderShownAt: undefined,
          lastExportAt: undefined,
        });
      },
    }),
    {
      name: ROOT_KEY,
      storage: {
        getItem: (key) => {
          const raw = abStorage.getItem(key);
          if (!raw) return null;
          try {
            return JSON.parse(typeof raw === "string" ? raw : String(raw));
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          abStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          abStorage.removeItem(key);
        },
      },
      // Persist everything except transient UI.
      partialize: (s) =>
        ({
          families: s.families,
          activeFamilyId: s.activeFamilyId,
          currentViewerPersonId: s.currentViewerPersonId,
          reminderEnabled: s.reminderEnabled,
          reminderShownAt: s.reminderShownAt,
          lastExportAt: s.lastExportAt,
          theme: s.theme,
          persistGranted: s.persistGranted,
        }) as FamilyStoreShape,
    },
  ),
);

export function formatPerson(p: Person | undefined): string {
  if (!p) return "—";
  return `${p.surname} ${p.given}`.trim();
}

export function formatBirthYear(p: Person | undefined): string {
  if (!p?.birth) return "—";
  const b = p.birth;
  if (b.kind === "exact" || b.kind === "year") return `${b.y}〜`;
  if (b.kind === "era") return `${b.era}${b.year}年〜`;
  return "—";
}
