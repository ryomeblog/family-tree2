import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarePage, AppHeader } from "../components/ui";
import PersonForm from "./PersonForm";
import { useFamilyStore } from "../stores/familyStore";
import { useIsMobile } from "../hooks/useMediaQuery";

export default function EditPersonModal() {
  const { fid = "yamada", pid = "p_haruko" } = useParams();
  const nav = useNavigate();
  const familyName = useFamilyStore((s) => s.families[fid]?.name ?? "—");
  const isMobile = useIsMobile();
  return (
    <BarePage>
      <AppHeader familyName={familyName} back showFamilyMenu familyId={fid} />
      <div
        style={{
          height: "calc(100vh - 56px)",
          position: "relative",
          background: isMobile ? "transparent" : "rgba(26,25,21,0.36)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: isMobile ? "stretch" : "center",
            padding: isMobile ? 0 : 16,
            overflow: "hidden",
          }}
        >
          <PersonForm
            mode="edit"
            familyId={fid}
            personId={pid}
            onClose={() => nav(-1)}
          />
        </div>
      </div>
    </BarePage>
  );
}
