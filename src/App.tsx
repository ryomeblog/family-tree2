// Main app — React Router entry. Routes match DESIGN.md §4.2.
// Each route renders a page under src/pages (or a modal under
// src/modals).
import React, { useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";
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

// 未知の fid でアクセスしたら /home に戻す。リンク共有ミスや手入力のミスで
// 空データ画面が出る事故を防ぐ。
const FamilyGuard: React.FC = () => {
  const { fid } = useParams();
  const exists = useFamilyStore((s) => !!(fid && s.families[fid]));
  if (!exists) return <Navigate to="/home" replace />;
  return <Outlet />;
};

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

      {/* ── Family-scoped routes（未知 fid は /home にリダイレクト） ── */}
      <Route path="/family/:fid" element={<FamilyGuard />}>
        <Route path="tree" element={<TreeEditorPage />} />
        <Route path="delete" element={<DeleteConfirmModal />} />
        <Route path="relate" element={<RelationAddModal />} />
        <Route path="photo/:pid" element={<PhotoLightbox />} />

        <Route path="person/new" element={<AddPersonModal />} />
        <Route path="person/:pid" element={<PersonDetailPage />} />
        <Route path="person/:pid/edit" element={<EditPersonModal />} />
        <Route path="person/:pid/delete" element={<DeleteConfirmModal />} />

        <Route path="memories" element={<MemoriesListPage />} />
        <Route path="memory/new" element={<MemoryEditorPage />} />
        <Route path="memory/:mid" element={<MemoryDetailPage />} />
        <Route path="memory/:mid/edit" element={<MemoryEditorPage />} />
        <Route path="memory/:mid/delete" element={<DeleteConfirmModal />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </HashRouter>
);

export default App;
