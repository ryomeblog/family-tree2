// Shape used by both terms.json and privacy.json.
export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  id: string;
  title: string;
  /** semantic version of the document text itself (not the app). */
  version: string;
  /** YYYY-MM-DD when this version becomes effective. */
  effectiveDate: string;
  /** YYYY-MM-DD of the last edit. */
  lastUpdatedAt: string;
  intro: string;
  sections: LegalSection[];
  contact?: { label: string; value: string };
}
