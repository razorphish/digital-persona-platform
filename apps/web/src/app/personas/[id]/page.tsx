import { redirect } from "next/navigation";

export async function generateStaticParams() {
  return [] as Array<{ id: string }>;
}

export default function PersonaDynamicRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/persona-details?id=${params.id}`);
}
