"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChefHat,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Upload,
  X,
  Check,
  AlertCircle,
  User,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Instructor {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  instructor_title: string | null;
  instructor_bio: string | null;
  instructor_specialties: string[] | null;
  instructor_experience_years: number | null;
  instructor_image_url: string | null;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Instructor>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/instructors');
      if (!res.ok) throw new Error('Failed to fetch instructors');
      const data = await res.json();
      setInstructors(data.instructors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleEdit = (instructor: Instructor) => {
    setEditingId(instructor.id);
    setEditForm({
      instructor_title: instructor.instructor_title || '',
      instructor_bio: instructor.instructor_bio || '',
      instructor_specialties: instructor.instructor_specialties || [],
      instructor_experience_years: instructor.instructor_experience_years || 0,
    });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update');
      
      await fetchInstructors();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploadingImage(id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'instructors');
      formData.append('userId', id);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload');
      
      const data = await res.json();
      
      // Update profile with new image URL
      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructor_image_url: data.url }),
      });

      await fetchInstructors();
    } catch (err) {
      console.error('Failed to upload:', err);
    } finally {
      setUploadingImage(null);
    }
  };

  const filteredInstructors = instructors.filter(i => 
    i.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Instructors</h1>
          <p className="text-stone-500 mt-1">Manage instructor profiles and credentials</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchInstructors}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Instructor
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructors Grid */}
      {filteredInstructors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="font-semibold text-stone-900 mb-2">No instructors found</h3>
            <p className="text-stone-500 mb-4">
              {instructors.length === 0 
                ? 'Create a user with the "instructor" role to get started'
                : 'Try adjusting your search'}
            </p>
            <Link href="/admin/users/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <Card key={instructor.id} className="overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-amber-100 to-stone-100">
                {(instructor.instructor_image_url || instructor.avatar_url) ? (
                  <Image
                    src={instructor.instructor_image_url || instructor.avatar_url || ''}
                    alt={instructor.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ChefHat className="h-20 w-20 text-amber-300" />
                  </div>
                )}
                
                {/* Upload button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(instructor.id, file);
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2"
                  onClick={() => {
                    setUploadingImage(instructor.id);
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingImage === instructor.id}
                >
                  {uploadingImage === instructor.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Photo
                    </>
                  )}
                </Button>
              </div>

              <CardContent className="p-4">
                {editingId === instructor.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Title (e.g., Head Chef)"
                      value={editForm.instructor_title || ''}
                      onChange={(e) => setEditForm({ ...editForm, instructor_title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Bio"
                      value={editForm.instructor_bio || ''}
                      onChange={(e) => setEditForm({ ...editForm, instructor_bio: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm h-20"
                    />
                    <input
                      type="text"
                      placeholder="Specialties (comma separated)"
                      value={editForm.instructor_specialties?.join(', ') || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        instructor_specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Years of Experience"
                      value={editForm.instructor_experience_years || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        instructor_experience_years: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(instructor.id)}
                        disabled={saving}
                      >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-stone-900">{instructor.full_name}</h3>
                        {instructor.instructor_title && (
                          <p className="text-amber-600 text-sm font-medium">{instructor.instructor_title}</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(instructor)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-stone-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-stone-400" />
                        {instructor.email}
                      </div>
                      {instructor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-stone-400" />
                          {instructor.phone}
                        </div>
                      )}
                      {instructor.instructor_experience_years && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-stone-400" />
                          {instructor.instructor_experience_years} years experience
                        </div>
                      )}
                    </div>

                    {instructor.instructor_bio && (
                      <p className="mt-3 text-sm text-stone-600 line-clamp-2">
                        {instructor.instructor_bio}
                      </p>
                    )}

                    {instructor.instructor_specialties && instructor.instructor_specialties.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {instructor.instructor_specialties.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <Badge className="bg-amber-100 text-amber-700">
                        <ChefHat className="h-3 w-3 mr-1" />
                        Instructor
                      </Badge>
                      <Link href={`/admin/users/${instructor.id}`}>
                        <Button size="sm" variant="outline">View Profile</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
