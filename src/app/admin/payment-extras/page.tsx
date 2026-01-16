"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface PaymentExtra {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminPaymentExtrasPage() {
  const [extras, setExtras] = useState<PaymentExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    isActive: true,
    sortOrder: 0,
  });

  const fetchExtras = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payment-extras");
      if (res.ok) {
        const data = await res.json();
        setExtras(data.extras || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment extras:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtras();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.price) {
      alert("Please fill in required fields");
      return;
    }

    setActionLoading("create");
    try {
      const res = await fetch("/api/admin/payment-extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          isActive: formData.isActive,
          sortOrder: formData.sortOrder || extras.length,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          description: "",
          price: "",
          isActive: true,
          sortOrder: 0,
        });
        fetchExtras();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create extra");
      }
    } catch (error) {
      console.error("Create extra error:", error);
      alert("Failed to create extra");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async (extra: PaymentExtra) => {
    setActionLoading(extra.id);
    try {
      const res = await fetch("/api/admin/payment-extras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: extra.id,
          name: extra.name,
          description: extra.description,
          price: extra.price,
          isActive: extra.is_active,
          sortOrder: extra.sort_order,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchExtras();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update extra");
      }
    } catch (error) {
      console.error("Update extra error:", error);
      alert("Failed to update extra");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this extra?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/payment-extras?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchExtras();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete extra");
      }
    } catch (error) {
      console.error("Delete extra error:", error);
      alert("Failed to delete extra");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (extra: PaymentExtra) => {
    setActionLoading(extra.id);
    try {
      const res = await fetch("/api/admin/payment-extras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: extra.id,
          isActive: !extra.is_active,
        }),
      });

      if (res.ok) {
        fetchExtras();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle extra");
      }
    } catch (error) {
      console.error("Toggle extra error:", error);
      alert("Failed to toggle extra");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Payment Extras</h1>
        <p className="text-stone-600 mt-1">
          Manage configurable extras for payment links
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-stone-900">
              Extras Items
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchExtras}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Extra
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-stone-500">
              Loading extras...
            </div>
          ) : extras.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              No extras configured yet
            </div>
          ) : (
            <div className="space-y-3">
              {extras.map((extra) => (
                <div
                  key={extra.id}
                  className="border border-stone-200 rounded-lg p-4"
                >
                  {editingId === extra.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={extra.name}
                        onChange={(e) => {
                          setExtras(
                            extras.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, name: e.target.value }
                                : ex
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={extra.description || ""}
                        onChange={(e) => {
                          setExtras(
                            extras.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, description: e.target.value }
                                : ex
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                        placeholder="Description (optional)"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={extra.price}
                        onChange={(e) => {
                          setExtras(
                            extras.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, price: parseFloat(e.target.value) || 0 }
                                : ex
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        value={extra.sort_order}
                        onChange={(e) => {
                          setExtras(
                            extras.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, sort_order: parseInt(e.target.value) || 0 }
                                : ex
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                        placeholder="Sort Order"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(extra)}
                          disabled={actionLoading === extra.id}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            fetchExtras();
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-stone-900">
                            {extra.name}
                          </h3>
                          <Badge
                            variant={extra.is_active ? "default" : "secondary"}
                          >
                            {extra.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {extra.description && (
                          <p className="text-sm text-stone-600 mt-1">
                            {extra.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold text-amber-600">
                            {formatPrice(extra.price)}
                          </span>
                          <span className="text-xs text-stone-500">
                            Order: {extra.sort_order}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(extra)}
                          disabled={actionLoading === extra.id}
                          title={extra.is_active ? "Deactivate" : "Activate"}
                        >
                          {extra.is_active ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-stone-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(extra.id)}
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(extra.id)}
                          disabled={actionLoading === extra.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-stone-900">
                Add New Extra
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="e.g., Table Setup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Price (AED) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm text-stone-700">
                  Active
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={actionLoading === "create"}
              >
                Create Extra
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
