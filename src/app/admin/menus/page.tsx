"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  ChefHat,
  Search,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  dishes: string[];
  price: number;
  price_unit: string;
  image_url: string | null;
  emoji: string | null;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  min_guests: number | null;
  max_guests: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { id: "birthday", name: "Kids Birthday", color: "bg-pink-100 text-pink-700" },
  { id: "corporate", name: "Corporate/Private", color: "bg-indigo-100 text-indigo-700" },
  { id: "nanny", name: "Nanny Classes", color: "bg-green-100 text-green-700" },
  { id: "walkin", name: "Walk-In Menu", color: "bg-amber-100 text-amber-700" },
  { id: "extras_food", name: "Food Add-ons", color: "bg-orange-100 text-orange-700" },
  { id: "extras_merch", name: "Merch Add-ons", color: "bg-purple-100 text-purple-700" },
];

const emptyItem: Partial<MenuItem> = {
  category: "birthday",
  name: "",
  description: "",
  dishes: [],
  price: 0,
  price_unit: "per person",
  image_url: null,
  emoji: "",
  is_active: true,
  is_popular: false,
  sort_order: 0,
};

export default function AdminMenusPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("birthday");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dishInput, setDishInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/menu-items");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.name) return;
    setSaving(true);
    try {
      const url = isCreating
        ? "/api/admin/menu-items"
        : `/api/admin/menu-items/${editingItem.id}`;
      const method = isCreating ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        await fetchItems();
        setEditingItem(null);
        setIsCreating(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems(items.filter((i) => i.id !== id));
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleToggleActive = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        setItems(items.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
      }
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (editingItem?.id) {
        formData.append("menuItemId", editingItem.id);
      }

      const res = await fetch("/api/admin/menu-items/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEditingItem({ ...editingItem, image_url: data.url });
        if (editingItem?.id) {
          setItems(items.map((i) => (i.id === editingItem.id ? { ...i, image_url: data.url } : i)));
        }
      } else {
        const err = await res.json();
        alert(err.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addDish = () => {
    if (!dishInput.trim() || !editingItem) return;
    setEditingItem({
      ...editingItem,
      dishes: [...(editingItem.dishes || []), dishInput.trim()],
    });
    setDishInput("");
  };

  const removeDish = (idx: number) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      dishes: (editingItem.dishes || []).filter((_, i) => i !== idx),
    });
  };

  const filteredItems = items
    .filter((i) => i.category === activeCategory)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const categoryCount = (cat: string) => items.filter((i) => i.category === cat).length;

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <ChefHat className="h-7 w-7" />
              Menu Editor
            </h1>
            <p className="text-stone-500 mt-1">
              Manage menu items, prices, and images for all booking types
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingItem({ ...emptyItem, category: activeCategory });
              setIsCreating(true);
              setDishInput("");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-100 border"
              }`}
            >
              {cat.name}
              <span className="ml-2 text-xs opacity-70">({categoryCount(cat.id)})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>

        {/* Menu Items Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all ${!item.is_active ? "opacity-50" : ""}`}
            >
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    {item.emoji ? (
                      <span className="text-5xl">{item.emoji}</span>
                    ) : (
                      <ImageIcon className="h-10 w-10 text-stone-300" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.is_popular && (
                    <Badge className="bg-amber-500 text-white text-xs">Popular</Badge>
                  )}
                  <Badge className={`text-xs ${item.is_active ? "bg-green-500 text-white" : "bg-stone-400 text-white"}`}>
                    {item.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-stone-900">{item.name}</h3>
                  <span className="text-lg font-bold text-stone-900">
                    {item.price} AED
                  </span>
                </div>

                {item.dishes && item.dishes.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {item.dishes.slice(0, 3).map((dish, idx) => (
                      <p key={idx} className="text-xs text-stone-500 truncate">
                        {dish}
                      </p>
                    ))}
                    {item.dishes.length > 3 && (
                      <p className="text-xs text-stone-400">
                        +{item.dishes.length - 3} more
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingItem({ ...item });
                      setIsCreating(false);
                      setDishInput("");
                    }}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(item)}
                  >
                    {item.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-stone-500">
              <ChefHat className="h-12 w-12 mx-auto mb-3 text-stone-300" />
              <p className="font-medium">No menu items in this category</p>
              <p className="text-sm mt-1">Click "Add Menu Item" to create one</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-stone-900">
                {isCreating ? "Add Menu Item" : "Edit Menu Item"}
              </h2>
              <button onClick={() => { setEditingItem(null); setIsCreating(false); }}>
                <X className="h-5 w-5 text-stone-400 hover:text-stone-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Image</label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-32 h-32 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-stone-300 hover:border-stone-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {editingItem.image_url ? (
                      <img src={editingItem.image_url} alt="" className="w-full h-full object-cover" />
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-stone-500">Click to upload an image</p>
                    <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP. Max 5MB.</p>
                    {editingItem.image_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-red-500"
                        onClick={() => setEditingItem({ ...editingItem, image_url: null })}
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <select
                  value={editingItem.category || "birthday"}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Name & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editingItem.name || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="e.g. Texas Roadhouse"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (AED) *</label>
                  <input
                    type="number"
                    value={editingItem.price || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    placeholder="275"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Emoji & Price Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editingItem.emoji || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, emoji: e.target.value })}
                    placeholder="e.g. 🍔"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price Unit</label>
                  <select
                    value={editingItem.price_unit || "per person"}
                    onChange={(e) => setEditingItem({ ...editingItem, price_unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="per person">Per Person</option>
                    <option value="per item">Per Item</option>
                    <option value="per portion">Per Portion</option>
                    <option value="per bag">Per Bag</option>
                    <option value="flat rate">Flat Rate</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Dishes */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Dishes / Items Included
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={dishInput}
                    onChange={(e) => setDishInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDish())}
                    placeholder="Add a dish..."
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <Button size="sm" onClick={addDish} disabled={!dishInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {(editingItem.dishes || []).map((dish, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-1.5">
                      <GripVertical className="h-3 w-3 text-stone-300" />
                      <span className="flex-1 text-sm">{dish}</span>
                      <button onClick={() => removeDish(idx)} className="text-red-400 hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_active !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Active (visible to customers)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_popular || false}
                    onChange={(e) => setEditingItem({ ...editingItem, is_popular: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Popular</span>
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingItem.sort_order || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <span className="text-xs text-stone-400 ml-2">Lower numbers appear first</span>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setEditingItem(null); setIsCreating(false); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !editingItem.name}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isCreating ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
