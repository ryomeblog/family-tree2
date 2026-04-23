import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarePage, AppHeader } from "../components/ui";
import PersonForm from "./PersonForm";

export default function EditPersonModal() {
  const { fid = "yamada", pid = "p_haruko" } = useParams();
  const nav = useNavigate();
  return (
    <BarePage>
      <AppHeader
        familyName="山田家"
        back
        backTo={`/family/${fid}/person/${pid}`}
        showFamilyMenu
        familyId={fid}
      />
      <div
        style={{
          height: "calc(100vh - 56px)",
          position: "relative",
          background: "rgba(26,25,21,0.36)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 16,
            overflow: "hidden",
          }}
        >
          <PersonForm
            mode="edit"
            familyId={fid}
            personId={pid}
            onClose={() => nav(`/family/${fid}/person/${pid}`)}
          />
        </div>
      </div>
    </BarePage>
  );
}
