import { AuthGuard } from "@/components/auth/AuthGuard";
import CreatorProfileClient from "./CreatorProfileClient";

export async function generateStaticParams() {
  // For static export, we need to provide at least one static param
  // In a real app, you'd fetch actual creator IDs from your database
  // For now, we'll provide a placeholder that allows dynamic rendering
  return [
    { id: "placeholder" },
  ];
}

interface CreatorProfilePageProps {
  params: {
    id: string;
  };
}

export default function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  return (
    <AuthGuard>
      <CreatorProfileClient creatorId={params.id} />
    </AuthGuard>
  );
}
