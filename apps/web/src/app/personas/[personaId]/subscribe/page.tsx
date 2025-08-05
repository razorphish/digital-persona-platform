import React from "react";
import SubscribePageClient from "./SubscribePageClient";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array to make this a client-only dynamic route
  // This allows the page to work with any personaId at runtime
  return [];
}

// Server component wrapper for static generation
export default function PersonaSubscribePage({ params }: { params: { personaId: string } }) {
  return <SubscribePageClient personaId={params.personaId} />;
}