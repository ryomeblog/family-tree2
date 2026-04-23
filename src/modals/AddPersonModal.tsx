import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarePage } from "../components/ui";
import { AppHeader } from "../components/ui";
import PersonForm from "./PersonForm";
import { C } from "../components/ui";

export default function AddPersonModal() {
  const { fid = "yamada" } = useParams();
  const nav = useNavigate();
  return (
    <BarePage>
      <AppHeader
        familyName="山田家"
        back
        backTo={`/family/${fid}/tree`}
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
            mode="add"
            familyId={fid}
            onClose={() => nav(`/family/${fid}/tree`)}
          />
        </div>
      </div>
    </BarePage>
  );
}
