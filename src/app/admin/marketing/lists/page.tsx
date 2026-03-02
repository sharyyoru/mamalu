"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users, Search, Trash2, X, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ContactList {
  id: string;
  name: string;
  description?: string;
  color?: string;
  member_count?: number;
  created_at: string;
}

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  source: string;
  selected?: boolean;
}

export default function ListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddContactsModal, setShowAddContactsModal] = useState<{ show: boolean; list: ContactList | null }>({ show: false, list: null });
  const [newList, setNewList] = useState({ name: "", description: "", color: "#8B5CF6" });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/marketing/lists");
      const data = await res.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error("Error fetching lists:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch("/api/admin/marketing/contacts");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreateList = async () => {
    if (!newList.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/marketing/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newList),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewList({ name: "", description: "", color: "#8B5CF6" });
        fetchLists();
      }
    } catch (error) {
      console.error("Error creating list:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    try {
      await fetch(`/api/admin/marketing/lists?id=${id}`, { method: "DELETE" });
      fetchLists();
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const openAddContactsModal = (list: ContactList) => {
    setShowAddContactsModal({ show: true, list });
    setSelectedContacts(new Set());
    setContactSearch("");
    fetchContacts();
  };

  const toggleContact = (email: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedContacts(newSelected);
  };

  const selectAllFiltered = () => {
    const newSelected = new Set(selectedContacts);
    filteredContacts.forEach(c => newSelected.add(c.email));
    setSelectedContacts(newSelected);
  };

  const handleAddContacts = async () => {
    if (!showAddContactsModal.list || selectedContacts.size === 0) return;
    setSaving(true);
    try {
      const contactsToAdd = contacts
        .filter(c => selectedContacts.has(c.email))
        .map(c => ({ email: c.email, id: c.id, source: c.source }));

      const res = await fetch("/api/admin/marketing/lists/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: showAddContactsModal.list.id,
          contacts: contactsToAdd,
        }),
      });

      if (res.ok) {
        setShowAddContactsModal({ show: false, list: null });
        fetchLists();
      }
    } catch (error) {
      console.error("Error adding contacts:", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const search = contactSearch.toLowerCase();
    return (
      c.email.toLowerCase().includes(search) ||
      (c.first_name && c.first_name.toLowerCase().includes(search)) ||
      (c.last_name && c.last_name.toLowerCase().includes(search)) ||
      (c.full_name && c.full_name.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "var(--font-recoleta)" }}>
            Contact Lists
          </h1>
          <p className="text-stone-600 mt-1">Create and manage contact lists for targeted campaigns</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="h-4 w-4 mr-2" />
          New List
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No lists yet</h3>
            <p className="text-stone-500 mb-4">Create your first contact list to start organizing your audience</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: list.color || "#8B5CF6" }}
                    >
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900">{list.name}</h3>
                      <p className="text-sm text-stone-500">{list.member_count || 0} contacts</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteList(list.id)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {list.description && (
                  <p className="text-sm text-stone-600 mt-3">{list.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddContactsModal(list)}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contacts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New List</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">List Name</label>
                <Input
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="e.g., VIP Customers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                <Input
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {["#8B5CF6", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#EC4899"].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${newList.color === color ? "ring-2 ring-offset-2 ring-stone-400" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewList({ ...newList, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateList} disabled={!newList.name || saving}>
                {saving ? "Creating..." : "Create List"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contacts Modal */}
      {showAddContactsModal.show && showAddContactsModal.list && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Add Contacts to List</h2>
                <p className="text-sm text-stone-500">{showAddContactsModal.list.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddContactsModal({ show: false, list: null })}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts by name or email..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                Select All
              </Button>
            </div>

            {selectedContacts.size > 0 && (
              <div className="mb-4 p-2 bg-amber-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-amber-700">{selectedContacts.size} contacts selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedContacts(new Set())}>
                  Clear
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto border rounded-lg">
              {loadingContacts ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-stone-500">
                  No contacts found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredContacts.slice(0, 100).map((contact) => (
                    <div
                      key={contact.email}
                      className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-stone-50 ${
                        selectedContacts.has(contact.email) ? "bg-amber-50" : ""
                      }`}
                      onClick={() => toggleContact(contact.email)}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          selectedContacts.has(contact.email)
                            ? "bg-amber-500 border-amber-500"
                            : "border-stone-300"
                        }`}
                      >
                        {selectedContacts.has(contact.email) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 truncate">
                          {contact.full_name || contact.first_name || contact.email}
                        </p>
                        <p className="text-sm text-stone-500 truncate">{contact.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {contact.source}
                      </Badge>
                    </div>
                  ))}
                  {filteredContacts.length > 100 && (
                    <div className="p-3 text-center text-sm text-stone-500">
                      Showing 100 of {filteredContacts.length} contacts. Use search to find more.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddContactsModal({ show: false, list: null })}>
                Cancel
              </Button>
              <Button
                onClick={handleAddContacts}
                disabled={selectedContacts.size === 0 || saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? "Adding..." : `Add ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
