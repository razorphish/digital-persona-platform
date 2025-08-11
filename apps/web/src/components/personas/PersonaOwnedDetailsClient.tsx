"use client";

import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";

export default function PersonaOwnedDetailsClient({ personaId }: { personaId: string }) {
  const router = useRouter();
  const { data: persona, isLoading } = trpc.personas.getOwned.useQuery(
    { id: personaId },
    { enabled: !!personaId }
  );
  const updateMutation = trpc.personas.update.useMutation();

  const p = persona as any;
  const [form, setForm] = useState<any>({});

  const initial = useMemo(
    () => ({
      name: p?.name || "",
      description: p?.description || "",
      privacyLevel: p?.privacyLevel || "friends",
      isPubliclyListed: Boolean(p?.isPubliclyListed),
      requiresSubscription: Boolean(p?.requiresSubscription),
      subscriptionPrice: p?.subscriptionPrice || "",
      preferences: {
        allowGlobalPosts: Boolean(p?.preferences?.allowGlobalPosts),
        allowConnectionPosts: Boolean(p?.preferences?.allowConnectionPosts),
        allowConsumerPosts: Boolean(p?.preferences?.allowConsumerPosts),
      },
    }),
    [p]
  );

  React.useEffect(() => setForm(initial), [initial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev: any) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePrefChange = (name: string, checked: boolean) => {
    setForm((prev: any) => ({
      ...prev,
      preferences: { ...(prev.preferences || {}), [name]: checked },
    }));
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
        subscriptionPrice: form.subscriptionPrice ? Number(form.subscriptionPrice) : null,
        preferences: form.preferences,
      } as any,
    });
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-6">Loading persona...</div>;
  }
  if (!p) {
    return <div className="max-w-4xl mx-auto p-6">Persona not found or not owned.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Persona Settings</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/persona-details?id=${personaId}`)} className="px-3 py-2 border rounded">View Public</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" value={form.name || ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Privacy Level</label>
            <select name="privacyLevel" value={form.privacyLevel || "friends"} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="subscribers">Subscribers</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description || ""} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isPubliclyListed" checked={!!form.isPubliclyListed} onChange={handleChange} />
            <span className="text-sm">Publicly listed</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="requiresSubscription" checked={!!form.requiresSubscription} onChange={handleChange} />
            <span className="text-sm">Requires subscription</span>
          </label>
        </div>

        {form.requiresSubscription && (
          <div>
            <label className="block text-sm font-medium mb-1">Subscription Price (USD)</label>
            <input name="subscriptionPrice" type="number" min={0} step={0.01} value={form.subscriptionPrice || ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        )}

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Posting Options</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.preferences?.allowGlobalPosts} onChange={(e) => handlePrefChange("allowGlobalPosts", e.target.checked)} />
              <span className="text-sm">Allow global feed posts</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.preferences?.allowConnectionPosts} onChange={(e) => handlePrefChange("allowConnectionPosts", e.target.checked)} />
              <span className="text-sm">Allow posts to connections' feeds</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.preferences?.allowConsumerPosts} onChange={(e) => handlePrefChange("allowConsumerPosts", e.target.checked)} />
              <span className="text-sm">Allow posts on consumer pages</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}


