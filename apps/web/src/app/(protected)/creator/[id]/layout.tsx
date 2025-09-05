// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array to indicate no static params should be generated
  // This allows the page to be rendered dynamically when needed
  return [];
}

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
