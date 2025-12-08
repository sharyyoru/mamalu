"use client";

import { useEffect, useState, useCallback } from "react";
import { set, unset, StringInputProps } from "sanity";

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  instructor_title: string | null;
  instructor_image_url: string | null;
  avatar_url: string | null;
}

export function InstructorInput(props: StringInputProps) {
  const { value, onChange, schemaType } = props;
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/instructors");
      if (!res.ok) throw new Error("Failed to fetch instructors");
      const data = await res.json();
      setInstructors(data.instructors || []);
      
      // Set selected instructor if value exists
      if (value && data.instructors) {
        const found = data.instructors.find((i: Instructor) => i.id === value);
        setSelectedInstructor(found || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      if (newValue) {
        onChange(set(newValue));
        const found = instructors.find((i) => i.id === newValue);
        setSelectedInstructor(found || null);
      } else {
        onChange(unset());
        setSelectedInstructor(null);
      }
    },
    [onChange, instructors]
  );

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px",
    },
    label: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#1a1a1a",
    },
    description: {
      fontSize: "12px",
      color: "#6b7280",
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      borderRadius: "4px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#fff",
      cursor: "pointer",
    },
    card: {
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#f9fafb",
    },
    cardPrimary: {
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #3b82f6",
      backgroundColor: "#eff6ff",
    },
    cardWarning: {
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #f59e0b",
      backgroundColor: "#fffbeb",
    },
    cardError: {
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #ef4444",
      backgroundColor: "#fef2f2",
    },
    flex: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    avatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#e5e7eb",
      objectFit: "cover" as const,
    },
    name: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#1a1a1a",
    },
    subtitle: {
      fontSize: "12px",
      color: "#6b7280",
    },
    loading: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#6b7280",
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid #e5e7eb",
      borderTopColor: "#3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>Loading instructors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.cardError}>
        <span style={{ color: "#dc2626", fontSize: "13px" }}>Error: {error}</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <select 
        value={value || ""} 
        onChange={handleChange}
        style={styles.select}
      >
        <option value="">Select an instructor...</option>
        {instructors.map((instructor) => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.full_name}
            {instructor.instructor_title ? ` - ${instructor.instructor_title}` : ""}
          </option>
        ))}
      </select>

      {selectedInstructor && (
        <div style={styles.cardPrimary}>
          <div style={styles.flex}>
            {(selectedInstructor.instructor_image_url || selectedInstructor.avatar_url) ? (
              <img
                src={selectedInstructor.instructor_image_url || selectedInstructor.avatar_url || ""}
                alt={selectedInstructor.full_name}
                style={styles.avatar}
              />
            ) : (
              <div style={{
                ...styles.avatar,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 600,
                color: "#6b7280",
              }}>
                {selectedInstructor.full_name?.charAt(0)}
              </div>
            )}
            <div>
              <div style={styles.name}>{selectedInstructor.full_name}</div>
              {selectedInstructor.instructor_title && (
                <div style={styles.subtitle}>{selectedInstructor.instructor_title}</div>
              )}
              <div style={styles.subtitle}>{selectedInstructor.email}</div>
            </div>
          </div>
        </div>
      )}

      {instructors.length === 0 && (
        <div style={styles.cardWarning}>
          <span style={{ fontSize: "13px", color: "#b45309" }}>
            No instructors found. Create users with the &quot;instructor&quot; role in Admin → Users.
          </span>
        </div>
      )}
    </div>
  );
}
