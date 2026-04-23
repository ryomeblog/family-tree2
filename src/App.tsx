// Main app — React Router entry. Routes match DESIGN.md §4.2.
// Each route renders a page under src/pages (or a modal under
// src/modals).
import React, { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { GlobalToast } from "./components/ui";
import { useFamilyStore } from "./stores/familyStore";
import { registerSW } from "./pwa/registerSW";
import { checkMonthlyReminder } from "./pwa/reminder";
import { refreshStorageEstimate } from "./pwa/persist";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import TreeEditorPage from "./pages/TreeEditorPage";
import PersonDetailPage from "./pages/PersonDetailPage";
import MemoriesListPage from "./pages/MemoriesListPage";
import MemoryDetailPage from "./pages/MemoryDetailPage";
import MemoryEditorPage from "./pages/MemoryEditorPage";
import OpenFamilyPage from "./pages/OpenFamilyPage";
import ImportPage from "./pages/ImportPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

import NewFamilyModal from "./modals/NewFamilyModal";
import AddPersonModal from "./modals/AddPersonModal";
import EditPersonModal from "./modals/EditPersonModal";
import RelationAddModal from "./modals/RelationAddModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import ImportErrorModal from "./modals/ImportErrorModal";
import PhotoLightbox from "./modals/PhotoLightbox";

const BootstrapEffects: React.FC = () => {
  const dirty = useFamilyStore((s) => s.dirty);
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    registerSW();
    checkMonthlyReminder();
    refreshStorageEstimate();
  }, []);
  return null;
};

export const App: React.FC = () => (
  <HashRouter>
    <BootstrapEffects />
    <GlobalToast />
    <Routes>
      {/* ── Marketing / auth-less entry ─────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* ── App-wide ───────────────────────────────────────────── */}
      <Route path="/home" element={<DashboardPage />} />
      <Route path="/new" element={<NewFamilyModal />} />
      <Route path="/open" element={<OpenFamilyPage />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/import/error" element={<ImportErrorModal />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/delete-all" element={<DeleteConfirmModal />} />

      {/* ── Family-scoped routes ───────────────────────────────── */}
      <Route path="/family/:fid/tree" element={<TreeEditorPage />} />
      <Route path="/family/:fid/delete" element={<DeleteConfirmModal />} />
      <Route path="/family/:fid/relate" element={<RelationAddModal />} />
      <Route path="/family/:fid/photo/:pid" element={<PhotoLightbox />} />

      <Route path="/family/:fid/person/new" element={<AddPersonModal />} />
      <Route path="/family/:fid/person/:pid" element={<PersonDetailPage />} />
      <Route path="/family/:fid/person/:pid/edit" element={<EditPersonModal />} />
      <Route path="/family/:fid/person/:pid/delete" element={<DeleteConfirmModal />} />

      <Route path="/family/:fid/memories" element={<MemoriesListPage />} />
      <Route path="/family/:fid/memory/new" element={<MemoryEditorPage />} />
      <Route path="/family/:fid/memory/:mid" element={<MemoryDetailPage />} />
      <Route path="/family/:fid/memory/:mid/edit" element={<MemoryEditorPage />} />
      <Route path="/family/:fid/memory/:mid/delete" element={<DeleteConfirmModal />} />

      {/* ── Fallback ───────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </HashRouter>
);

export default App;
