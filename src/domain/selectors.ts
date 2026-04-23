import { Family, Memory, Person, PersonId } from "./types";

export function canViewMemory(
  m: Memory,
  viewerPersonId: PersonId | null | undefined,
): boolean {
  if (!viewerPersonId) return false;
  if (m.authorId === viewerPersonId) return true;
  return m.viewers.includes(viewerPersonId);
}

export function parentsOf(family: Family, pid: PersonId): Person[] {
  const links = family.links.filter((l) => l.childId === pid);
  const parents: Person[] = [];
  for (const l of links) {
    if (l.parentUnion) {
      const u = family.unions.find((x) => x.id === l.parentUnion);
      if (u) {
        const a = family.people[u.partnerA];
        const b = family.people[u.partnerB];
        if (a) parents.push(a);
        if (b) parents.push(b);
      }
    } else if (l.parentId) {
      const p = family.people[l.parentId];
      if (p) parents.push(p);
    }
  }
  return parents;
}

export function childrenOf(family: Family, pid: PersonId): Person[] {
  const unionIds = family.unions
    .filter((u) => u.partnerA === pid || u.partnerB === pid)
    .map((u) => u.id);
  const childIds = family.links
    .filter(
      (l) =>
        (l.parentUnion && unionIds.includes(l.parentUnion)) ||
        l.parentId === pid,
    )
    .map((l) => l.childId);
  return childIds
    .map((id) => family.people[id])
    .filter((p): p is Person => !!p);
}

export function spousesOf(family: Family, pid: PersonId): Person[] {
  return family.unions
    .filter((u) => u.partnerA === pid || u.partnerB === pid)
    .map((u) => (u.partnerA === pid ? u.partnerB : u.partnerA))
    .map((id) => family.people[id])
    .filter((p): p is Person => !!p);
}

export function siblingsOf(family: Family, pid: PersonId): Person[] {
  const parentLinks = family.links.filter((l) => l.childId === pid);
  if (parentLinks.length === 0) return [];
  const siblings: Person[] = [];
  const seen = new Set<string>([pid]);
  for (const pl of parentLinks) {
    for (const l of family.links) {
      if (l.childId === pid) continue;
      if (
        (pl.parentUnion && l.parentUnion === pl.parentUnion) ||
        (pl.parentId && l.parentId === pl.parentId)
      ) {
        if (seen.has(l.childId)) continue;
        seen.add(l.childId);
        const p = family.people[l.childId];
        if (p) siblings.push(p);
      }
    }
  }
  return siblings;
}

export function memoriesOfPerson(
  family: Family,
  pid: PersonId,
): Memory[] {
  return Object.values(family.memories).filter(
    (m) =>
      m.protagonistId === pid ||
      m.authorId === pid ||
      m.related.includes(pid),
  );
}
