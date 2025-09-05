import { AuthGuard } from "@/components/auth/AuthGuard";
import CreatorProfileClient from "./CreatorProfileClient";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array to indicate no static params should be generated
  // This allows the page to be rendered dynamically when needed
  return [];
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