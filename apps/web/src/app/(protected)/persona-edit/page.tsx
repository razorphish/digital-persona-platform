"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function PersonaEditClientPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const personaId = searchParams.get("id") || "";

  const { data: persona, isLoading } = trpc.personas.getOwned.useQuery(
    { id: personaId },
    { enabled: Boolean(personaId) }
  );

  const updateMutation = trpc.personas.update.useMutation();

  const [form, setForm] = useState<any>({});
  const p = persona as any;
  const initial = useMemo(
    () => ({
      name: p?.name || "",
      description: p?.description || "",
      privacyLevel: p?.privacyLevel || "friends",
      isPubliclyListed: Boolean(p?.isPubliclyListed),
      requiresSubscription: Boolean(p?.requiresSubscription),
      subscriptionPrice: p?.subscriptionPrice || "",
      allowGlobalPosts: Boolean(p?.preferences?.allowGlobalPosts),
      allowConnectionPosts: Boolean(p?.preferences?.allowConnectionPosts),
      allowConsumerPosts: Boolean(p?.preferences?.allowConsumerPosts),
    }),
    [p]
  );

  React.useEffect(() => setForm(initial), [initial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev: any) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: personaId,
      data: {
        name: form.name,
        description: form.description,
        privacyLevel: form.privacyLevel,
        isPubliclyListed: form.isPubliclyListed,
        requiresSubscription: form.requiresSubscription,
        subscriptionPrice: form.subscriptionPrice ? Number(form.subscriptionPrice) : undefined,
        preferences: {
          allowGlobalPosts: form.allowGlobalPosts,
          allowConnectionPosts: form.allowConnectionPosts,
          allowConsumerPosts: form.allowConsumerPosts,
        },
      } as any,
    });
    router.push(`/persona-details?id=${personaId}`);
  };

  if (!personaId) return null;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!p) return <div className="p-6">Persona not found</div>;

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Edit Persona</h1>
        <div className="space-y-4 bg-white rounded-lg shadow p-6">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" value={form.name || ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description || ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Privacy Level</label>
              <select name="privacyLevel" value={form.privacyLevel || "friends"} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="subscribers">Subscribers</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="isPubliclyListed" type="checkbox" name="isPubliclyListed" checked={!!form.isPubliclyListed} onChange={handleChange} />
              <label htmlFor="isPubliclyListed" className="text-sm">Publicly listed</label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input id="requiresSubscription" type="checkbox" name="requiresSubscription" checked={!!form.requiresSubscription} onChange={handleChange} />
              <label htmlFor="requiresSubscription" className="text-sm">Requires subscription</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Price (USD)</label>
              <input name="subscriptionPrice" type="number" min={0} step={0.01} value={form.subscriptionPrice || ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Posting Options</h2>
            <p className="text-sm text-gray-600 mb-3">Control where this persona can post updates.</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="allowGlobalPosts" checked={!!form.allowGlobalPosts} onChange={handleChange} />
                <span className="text-sm">Allow global feed posts</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="allowConnectionPosts" checked={!!form.allowConnectionPosts} onChange={handleChange} />
                <span className="text-sm">Allow posts to connections' feeds</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="allowConsumerPosts" checked={!!form.allowConsumerPosts} onChange={handleChange} />
                <span className="text-sm">Allow posts on consumer pages</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
            <button onClick={() => router.back()} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}


