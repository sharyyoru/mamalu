"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import {
  Cake,
  Coffee,
  Edit3,
  Eye,
  EyeOff,
  Gift,
  Image as ImageIcon,
  Loader2,
  PartyPopper,
  Plus,
  Save,
  Trash2,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface PartyExtra {
  id: string;
  categories: string[];
  name: string;
  description: string | null;
  price: number;
  price_unit: string;
  image_url: string | null;
  emoji: string | null;
  is_active: boolean;
  sort_order: number;
  metadata: {
    extra_category?: string;
    icon?: string;
    table_option?: boolean;
    table_pricing_tiers?: TablePricingTier[];
  } | null;
}

interface TablePricingTier {
  max_guests: number;
  price: number;
}

const defaultTablePricingTiers: TablePricingTier[] = [
  { max_guests: 10, price: 300 },
  { max_guests: 20, price: 400 },
  { max_guests: 30, price: 500 },
];

const extraAudiences = [
  {
    id: "party_extras",
    name: "Mini Chef Parties",
    title: "Party Extras",
    description: "Manage Mini Chef party add-ons, photos, and prices",
    emptyLabel: "party extras",
  },
  {
    id: "corporate_party_extras",
    name: "Corporate / Private",
    title: "Corporate / Private Extras",
    description: "Manage Big Chef corporate/private add-ons, photos, and prices",
    emptyLabel: "corporate/private extras",
  },
];

const extraCategories = [
  { id: "custom", name: "Personalized Items", icon: Gift },
  { id: "cake", name: "Birthday Cakes", icon: Cake },
  { id: "decor", name: "Decorations & Setup", icon: PartyPopper },
  { id: "snacks", name: "Snacks", icon: Utensils },
  { id: "drinks", name: "Drinks", icon: Coffee },
];

const iconOptions = [
  { id: "gift", name: "Gift" },
  { id: "cake", name: "Cake" },
  { id: "party", name: "Party" },
  { id: "utensils", name: "Utensils" },
  { id: "drinks", name: "Drinks" },
];

const emptyExtra: Partial<PartyExtra> = {
  categories: ["party_extras"],
  name: "",
  description: "",
  price: 0,
  price_unit: "per item",
  image_url: null,
  emoji: "",
  is_active: true,
  sort_order: 0,
  metadata: {
    extra_category: "custom",
    icon: "gift",
  },
};

const getDefaultIcon = (category: string) => {
  if (category === "cake") return "cake";
  if (category === "decor") return "party";
  if (category === "snacks") return "utensils";
  if (category === "drinks") return "drinks";
  return "gift";
};

export default function AdminPartyExtrasPage() {
  const [extras, setExtras] = useState<PartyExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExtra, setEditingExtra] = useState<Partial<PartyExtra> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showTablePricing, setShowTablePricing] = useState(false);
  const [tablePricingTiers, setTablePricingTiers] = useState<TablePricingTier[]>(defaultTablePricingTiers);
  const [activeAudience, setActiveAudience] = useState(extraAudiences[0].id);
  const [activeCategory, setActiveCategory] = useState("custom");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audienceConfig = extraAudiences.find((audience) => audience.id === activeAudience) || extraAudiences[0];

  const getExtraCategory = useCallback((extra: Partial<PartyExtra>) => extra.metadata?.extra_category || "custom", []);
  const isTableOption = useCallback((extra: Partial<PartyExtra>) =>
    Boolean(extra.metadata?.table_option)
    || (getExtraCategory(extra) === "decor" && (extra.description || "").toLowerCase().includes("plates, cups")), [getExtraCategory]);

  const fetchExtras = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/menu-items?category=${activeAudience}`);
      if (res.ok) {
        const data = await res.json();
        setExtras(data.items || []);
        const tableOption = (data.items || []).find((item: PartyExtra) => isTableOption(item));
        const tiers = tableOption?.metadata?.table_pricing_tiers;
        setTablePricingTiers(Array.isArray(tiers) && tiers.length > 0 ? tiers : defaultTablePricingTiers);
      }
    } catch {
      alert("Failed to load party extras");
    } finally {
      setLoading(false);
    }
  }, [activeAudience, isTableOption]);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  const openCreate = () => {
    setEditingExtra({
      ...emptyExtra,
      categories: [activeAudience],
      metadata: {
        extra_category: activeCategory,
        icon: getDefaultIcon(activeCategory),
      },
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingExtra?.name) return;
    setSaving(true);
    try {
      const otherAudienceIds = extraAudiences.map((audience) => audience.id).filter((id) => id !== activeAudience);
      const categories = Array.from(new Set([...(editingExtra.categories || []), activeAudience]))
        .filter((category) => !otherAudienceIds.includes(category));
      const payload = {
        ...editingExtra,
        categories,
        price: Number(editingExtra.price) || 0,
        price_unit: editingExtra.price_unit || "per item",
        metadata: {
          ...(editingExtra.metadata || {}),
          extra_category: getExtraCategory(editingExtra),
          table_option: Boolean(editingExtra.metadata?.table_option),
          table_pricing_tiers: editingExtra.metadata?.table_option ? tablePricingTiers : undefined,
        },
      };
      const url = isCreating ? "/api/admin/menu-items" : `/api/admin/menu-items/${editingExtra.id}`;
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save extra");
      }
      await fetchExtras();
      setEditingExtra(null);
      setIsCreating(false);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to save extra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this party extra?")) return;
    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExtras((prev) => prev.filter((extra) => extra.id !== id));
      }
    } catch {
      alert("Failed to delete extra");
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`/api/admin/party-extras/seed?category=${activeAudience}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to populate party extras");
      await fetchExtras();
      alert(`Populated ${data.inserted || 0} ${audienceConfig.emptyLabel}`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to populate party extras");
    } finally {
      setSeeding(false);
    }
  };

  const toggleActive = async (extra: PartyExtra) => {
    try {
      const res = await fetch(`/api/admin/menu-items/${extra.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !extra.is_active }),
      });
      if (res.ok) {
        setExtras((prev) =>
          prev.map((item) => item.id === extra.id ? { ...item, is_active: !item.is_active } : item)
        );
      }
    } catch {
      alert("Failed to update extra");
    }
  };

  const saveTablePricing = async () => {
    const normalizedTiers = tablePricingTiers
      .map((tier) => ({
        max_guests: Number(tier.max_guests) || 0,
        price: Number(tier.price) || 0,
      }))
      .filter((tier) => tier.max_guests > 0)
      .sort((a, b) => a.max_guests - b.max_guests);

    const tableOptions = extras.filter((extra) => isTableOption(extra));
    if (tableOptions.length === 0) {
      alert("Create or mark at least one Decorations & Setup item as a table option first.");
      return;
    }

    setSaving(true);
    try {
      const updates = await Promise.all(tableOptions.map((extra) =>
        fetch(`/api/admin/menu-items/${extra.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metadata: {
              ...(extra.metadata || {}),
              extra_category: "decor",
              icon: extra.metadata?.icon || "party",
              table_option: true,
              table_pricing_tiers: normalizedTiers,
            },
          }),
        })
      ));

      const failed = updates.find((res) => !res.ok);
      if (failed) throw new Error("Failed to save table pricing settings");
      setTablePricingTiers(normalizedTiers);
      await fetchExtras();
      setShowTablePricing(false);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to save table pricing settings");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (editingExtra?.id) {
        formData.append("menuItemId", editingExtra.id);
      }
      const res = await fetch("/api/admin/menu-items/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setEditingExtra((prev) => prev ? { ...prev, image_url: data.url } : prev);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filteredExtras = extras
    .filter((extra) => getExtraCategory(extra) === activeCategory)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <PartyPopper className="h-7 w-7" />
              {audienceConfig.title}
            </h1>
            <p className="text-stone-500 mt-1">{audienceConfig.description}</p>
          </div>
          <div className="flex gap-2">
            {activeAudience === "party_extras" && activeCategory === "decor" && (
              <Button variant="outline" onClick={() => setShowTablePricing(true)}>
                Table Pricing Settings
              </Button>
            )}
            <Button variant="outline" onClick={seedDefaults} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PartyPopper className="h-4 w-4 mr-2" />}
              Populate Defaults
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Extra
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {extraAudiences.map((audience) => (
            <button
              key={audience.id}
              onClick={() => setActiveAudience(audience.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeAudience === audience.id ? "bg-[#FF8C6B] text-white" : "bg-white text-stone-600 hover:bg-stone-100 border"}`}
            >
              {audience.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {extraCategories.map((category) => {
            const Icon = category.icon;
            const count = extras.filter((extra) => getExtraCategory(extra) === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeCategory === category.id ? "bg-stone-900 text-white" : "bg-white text-stone-600 hover:bg-stone-100 border"}`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExtras.map((extra) => (
            <Card key={extra.id} className={`overflow-hidden ${!extra.is_active ? "opacity-50" : ""}`}>
              <div className="relative h-40 bg-stone-100 flex items-center justify-center">
                {extra.image_url ? (
                  <Image src={extra.image_url} alt={extra.name} fill className="object-cover" />
                ) : extra.emoji ? (
                  <span className="text-5xl">{extra.emoji}</span>
                ) : (
                  <ImageIcon className="h-10 w-10 text-stone-300" />
                )}
                <Badge className={`absolute top-2 right-2 ${extra.is_active ? "bg-green-500" : "bg-stone-400"} text-white`}>
                  {extra.is_active ? "Active" : "Hidden"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between gap-3 mb-2">
                  <h3 className="font-bold text-stone-900">{extra.name}</h3>
                  <span className="font-bold text-stone-900">{formatPrice(extra.price)}</span>
                </div>
                <p className="text-sm text-stone-500 min-h-[40px]">{extra.description || "No description"}</p>
                <div className="flex gap-2 pt-4 mt-4 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingExtra({ ...extra }); setIsCreating(false); }}>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(extra)}>
                    {extra.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(extra.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredExtras.length === 0 && (
            <div className="col-span-full text-center py-12 text-stone-500">
              <PartyPopper className="h-12 w-12 mx-auto mb-3 text-stone-300" />
              <p className="font-medium">No {audienceConfig.emptyLabel} in this category</p>
              <p className="text-sm mt-1">Click &quot;Populate Defaults&quot; to import the default customization items</p>
              <Button variant="outline" className="mt-4" onClick={seedDefaults} disabled={seeding}>
                {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PartyPopper className="h-4 w-4 mr-2" />}
                Populate Defaults
              </Button>
            </div>
          )}
        </div>
      </div>

      {editingExtra && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-stone-900">{isCreating ? `Add ${audienceConfig.title.replace(" Extras", "")} Extra` : `Edit ${audienceConfig.title.replace(" Extras", "")} Extra`}</h2>
              <button onClick={() => { setEditingExtra(null); setIsCreating(false); }}>
                <X className="h-5 w-5 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-32 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-stone-300 hover:border-stone-400" onClick={() => fileInputRef.current?.click()}>
                    {editingExtra.image_url ? (
                      <Image src={editingExtra.image_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-stone-400" />
                        <p className="text-xs text-stone-400 mt-1">Upload</p>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="flex-1">
                    <p className="text-sm text-stone-500">Click to upload an image</p>
                    {editingExtra.image_url && (
                      <Button size="sm" variant="outline" className="mt-2 text-red-500" onClick={() => setEditingExtra({ ...editingExtra, image_url: null })}>
                        Remove Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className={`grid gap-4 ${editingExtra.metadata?.table_option ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
                  <input type="text" value={editingExtra.name || ""} onChange={(e) => setEditingExtra({ ...editingExtra, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                {!editingExtra.metadata?.table_option && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Price (AED) *</label>
                    <input type="number" value={editingExtra.price || ""} onChange={(e) => setEditingExtra({ ...editingExtra, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                  <select value={getExtraCategory(editingExtra)} onChange={(e) => setEditingExtra({ ...editingExtra, metadata: { ...(editingExtra.metadata || {}), extra_category: e.target.value, icon: editingExtra.metadata?.icon || getDefaultIcon(e.target.value) } })} className="w-full px-3 py-2 border rounded-lg">
                    {extraCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Icon fallback</label>
                  <select value={editingExtra.metadata?.icon || "gift"} onChange={(e) => setEditingExtra({ ...editingExtra, metadata: { ...(editingExtra.metadata || {}), icon: e.target.value } })} className="w-full px-3 py-2 border rounded-lg">
                    {iconOptions.map((icon) => (
                      <option key={icon.id} value={icon.id}>{icon.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {getExtraCategory(editingExtra) === "decor" && (
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(editingExtra.metadata?.table_option)}
                    onChange={(e) => setEditingExtra({
                      ...editingExtra,
                      metadata: {
                        ...(editingExtra.metadata || {}),
                        table_option: e.target.checked,
                        table_pricing_tiers: e.target.checked ? tablePricingTiers : undefined,
                      },
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Table option - use Table Pricing Settings for customer pricing</span>
                </label>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                <textarea value={editingExtra.description || ""} onChange={(e) => setEditingExtra({ ...editingExtra, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Emoji fallback</label>
                  <input type="text" value={editingExtra.emoji || ""} onChange={(e) => setEditingExtra({ ...editingExtra, emoji: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Sort Order</label>
                  <input type="number" value={editingExtra.sort_order || 0} onChange={(e) => setEditingExtra({ ...editingExtra, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingExtra.is_active !== false} onChange={(e) => setEditingExtra({ ...editingExtra, is_active: e.target.checked })} className="rounded" />
                <span className="text-sm">Active (visible to customers)</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setEditingExtra(null); setIsCreating(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !editingExtra.name}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isCreating ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTablePricing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Table Pricing Settings</h2>
              <button onClick={() => setShowTablePricing(false)}>
                <X className="h-5 w-5 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {tablePricingTiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Max Guests</label>
                    <input
                      type="number"
                      min={1}
                      value={tier.max_guests}
                      onChange={(e) => setTablePricingTiers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, max_guests: parseInt(e.target.value, 10) || 0 } : item))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Price (AED)</label>
                    <input
                      type="number"
                      min={0}
                      value={tier.price}
                      onChange={(e) => setTablePricingTiers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: parseFloat(e.target.value) || 0 } : item))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500"
                    onClick={() => setTablePricingTiers((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={tablePricingTiers.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setTablePricingTiers((current) => [...current, { max_guests: (current[current.length - 1]?.max_guests || 0) + 10, price: 0 }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTablePricing(false)}>Cancel</Button>
              <Button onClick={saveTablePricing} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
