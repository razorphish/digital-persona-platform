"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Provide empty static params so Next.js static export does not fail
export const dynamicParams = true;
export async function generateStaticParams() {
  return [] as Array<{ id: string }>;
}

export default function PersonaDynamicRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/persona-details?id=${id}`);
    }
  }, [id, router]);

  return null;
}


