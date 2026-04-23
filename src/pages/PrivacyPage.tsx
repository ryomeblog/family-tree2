import React from "react";
import LegalPage from "./LegalPage";
import privacy from "../data/legal/privacy.json";
import type { LegalDoc } from "../data/legal/types";

export default function PrivacyPage() {
  return <LegalPage doc={privacy as LegalDoc} />;
}
