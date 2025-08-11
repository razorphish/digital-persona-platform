"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PersonaOwnedDetailsClient from "@/components/personas/PersonaOwnedDetailsClient";

export default function PersonaOwnedDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  if (!id) return null;

  return (
    <AuthGuard>
      <PersonaOwnedDetailsClient personaId={id} />
    </AuthGuard>
  );
}


