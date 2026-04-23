import React from "react";
import LegalPage from "./LegalPage";
import terms from "../data/legal/terms.json";
import type { LegalDoc } from "../data/legal/types";

export default function TermsPage() {
  return <LegalPage doc={terms as LegalDoc} />;
}
