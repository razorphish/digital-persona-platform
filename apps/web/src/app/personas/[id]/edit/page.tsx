import { redirect } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;
export async function generateStaticParams() {
  return [] as Array<{ id: string }>;
}

export default function PersonaEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/persona-edit?id=${params.id}`);
}

