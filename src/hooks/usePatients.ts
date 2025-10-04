import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Patient, PatientStatus } from "@/types/patient";

interface PatientRecord {
  patient_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  pdf_file_path?: string;
  date_created?: string; // Use string for timestamps from DB
  date_reminded?: string;
  archive_status?: "archived" | "not_archived";
  date_archived?: string;
  status?:
    | "sent"
    | "reminded"
    | "appointment"
    | "no_appointment"
    | "terminated"
    | "no_response"; // Adjust to actual enum/string if needed
  user_id?: string;
  notes?: string;
  email_sent_count?: number;
  email_sent_at?: string;
}
// Helper function to generate signed URL for PDF
const generatePdfUrl = async (filePath: string): Promise<string | undefined> => {
  try {
    const { data, error } = await supabase.storage
      .from('Cost_estimates')
      .createSignedUrl(filePath, 2592000); // 1 month expiration (30 days * 24 hours * 60 minutes * 60 seconds)
    
    if (error) {
      console.error('Error generating signed URL:', error);
      return undefined;
    }
    
    // Convert relative signed URL to full HTTPS URL
    const fullUrl = data.signedUrl.startsWith('http') 
      ? data.signedUrl 
      : `https://fjrdillreulrmtdtwnth.supabase.co${data.signedUrl}`;
    
    return fullUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return undefined;
  }
};

// Helper function to format database record to Patient type
const formatPatient = async (record: PatientRecord): Promise<Patient> => {
  const fullName = record.first_name
    ? `${record.first_name} ${record.last_name}`
    : record.last_name;

  let pdfUrl: string | undefined;
  if (record.pdf_file_path) {
    pdfUrl = await generatePdfUrl(record.pdf_file_path);
  }

  return {
    id: record.patient_id?.toString() || "",
    name: fullName,
    email: record.email || undefined,
    pdfUrl,
    pdfFilePath: record.pdf_file_path || undefined,
    status: record.status as PatientStatus,
    createdAt: record.date_created,
    movedAt: record.date_reminded || undefined,
    notes: record.notes || undefined,
    emailSentCount: record.email_sent_count || 0,
    emailSentAt: record.email_sent_at || undefined,
  };
};

export const usePatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchPatients = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("data")
        .select("*")
        .eq("user_id", user.id)
        .neq("archive_status", "archived")
        .order("date_created", { ascending: true });

      if (error) throw error;

      const formattedPatients = await Promise.all(data?.map(formatPatient) || []);
      setPatients(formattedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Fehler beim Laden",
        description: "Patientendaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create patient with optimistic update
  const createPatient = useCallback(
    async (patientData: { name: string; email?: string; pdfFile?: File }) => {
      if (!user?.id) return;

      // Create optimistic patient
      const optimisticPatient: Patient = {
        id: `temp-${Date.now()}`,
        name: patientData.name,
        email: patientData.email,
        status: "sent" as PatientStatus,
        createdAt: new Date().toISOString(),
      };

      // Optimistically add to state
      setPatients((prev) => [...prev, optimisticPatient]);

      try {
        let pdfFilePath: string | undefined;

        // Upload PDF if provided
        if (patientData.pdfFile) {
          const fileName = `${user.id}/${Date.now()}-${
            patientData.pdfFile.name
          }`;
          const { error: uploadError } = await supabase.storage
            .from("Cost_estimates")
            .upload(fileName, patientData.pdfFile);

          if (uploadError) throw uploadError;
          pdfFilePath = fileName;
        }

        // Parse name
        const nameParts = patientData.name.trim().split(" ");
        const firstName =
          nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";
        const lastName = nameParts[nameParts.length - 1];

        // Insert to database
        const { data, error } = await supabase
          .from("data")
          .insert({
            user_id: user.id,
            first_name: firstName || null,
            last_name: lastName,
            email: patientData.email || null,
            status: "sent",
            pdf_file_path: pdfFilePath || null,
          })
          .select()
          .single();

        if (error) throw error;

        console.log("Created patient:", data);

        // Replace optimistic patient with real data immediately
        const realPatient = await formatPatient(data);
        setPatients((prev) =>
          prev.map((p) => (p.id === optimisticPatient.id ? realPatient : p))
        );
      } catch (error) {
        console.error("Error creating patient:", error);
        // Remove optimistic patient on error
        setPatients((prev) =>
          prev.filter((p) => p.id !== optimisticPatient.id)
        );

        toast({
          title: "Fehler beim Erstellen",
          description: "Patient konnte nicht erstellt werden.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [user?.id]
  );

  // Move patient with optimistic update
  const movePatient = useCallback(
    async (patientId: string, newStatus: PatientStatus) => {
      if (!user?.id) return;

      // Find current patient
      const currentPatient = patients.find((p) => p.id === patientId);
      if (!currentPatient) return;

      // Optimistically update local state
      const updatedPatient = {
        ...currentPatient,
        status: newStatus,
        movedAt:
          newStatus === "reminded"
            ? new Date().toISOString()
            : currentPatient.movedAt,
      };

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updatedPatient : p))
      );

      try {
        const updateData: Partial<PatientRecord> = { status: newStatus };
        if (newStatus === "reminded") {
          updateData.date_reminded = new Date().toISOString();
        }

        const { error } = await supabase
          .from("data")
          .update(updateData)
          .eq("patient_id", parseInt(patientId))
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error moving patient:", error);

        // Revert optimistic update on error
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? currentPatient : p))
        );

        toast({
          title: "Fehler beim Verschieben",
          description: "Patient konnte nicht verschoben werden.",
          variant: "destructive",
        });
      }
    },
    [user?.id, patients]
  );

  // Archive patient with optimistic update
  const archivePatient = useCallback(
    async (patientId: string, archiveType: "terminated" | "no_response") => {
      if (!user?.id) return;

      // Find current patient
      const currentPatient = patients.find((p) => p.id === patientId);
      if (!currentPatient) return;

      // Optimistically update local state
      const updatedPatient = {
        ...currentPatient,
        status: archiveType as PatientStatus,
      };

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updatedPatient : p))
      );

      try {
        const { error } = await supabase
          .from("data")
          .update({
            status: archiveType,
            date_archived: new Date().toISOString(),
          }) // Type assertion to work around outdated generated types
          .eq("patient_id", parseInt(patientId))
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error archiving patient:", error);

        // Revert optimistic update on error
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? currentPatient : p))
        );

        toast({
          title: "Fehler beim Archivieren",
          description: "Patient konnte nicht archiviert werden.",
          variant: "destructive",
        });
      }
    },
    [user?.id, patients]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("patient-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "data",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("Real-time INSERT:", payload);
          const newPatient = await formatPatient(payload.new);
          console.log("Formatted new patient:", newPatient);

          setPatients((prev) => {
            // Check if this patient already exists (from optimistic update)
            const existingIndex = prev.findIndex((p) => p.id === newPatient.id);
            if (existingIndex >= 0) {
              // Update existing patient with real data
              return prev.map((p, index) =>
                index === existingIndex ? newPatient : p
              );
            }
            // Add new patient if it doesn't exist
            return [...prev, newPatient];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "data",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("Real-time UPDATE:", payload);
          const updatedPatient = await formatPatient(payload.new);

          setPatients((prev) =>
            prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "data",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time DELETE:", payload);
          const deletedId = payload.old.patient_id?.toString();
          if (deletedId) {
            setPatients((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchPatients();
    }
  }, [fetchPatients, user?.id]);

  // Delete archived patients with optimistic update
  const deleteArchivedPatients = useCallback(async () => {
    if (!user?.id) return;

    // Find all archived patients
    const archivedPatients = patients.filter(
      p => p.status === 'terminated' || p.status === 'no_response'
    );

    if (archivedPatients.length === 0) return;

    // Optimistically remove from state
    setPatients(prev => prev.filter(
      p => p.status !== 'terminated' && p.status !== 'no_response'
    ));

    try {
      // Collect PDF file paths from archived patients for deletion
      const pdfFilesToDelete = archivedPatients
        .filter(patient => patient.pdfFilePath)
        .map(patient => patient.pdfFilePath!);

      // Delete PDF files from storage if any exist
      if (pdfFilesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('Cost_estimates')
          .remove(pdfFilesToDelete);

        if (storageError) {
          console.error('Error deleting PDF files:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete database records
      const { error } = await supabase
        .from('data')
        .delete()
        .eq('user_id', user.id)
        .in('status', ['terminated', 'no_response']);

      if (error) throw error;

      toast({
        title: "Erfolgreich gelöscht",
        description: `${archivedPatients.length} archivierte Einträge und zugehörige Dateien wurden gelöscht.`,
      });
    } catch (error) {
      console.error('Error deleting archived patients:', error);
      
      // Revert optimistic update on error
      setPatients(prev => [...prev, ...archivedPatients]);
      
      toast({
        title: "Fehler beim Löschen",
        description: "Archivierte Einträge konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  }, [user?.id, patients]);

  // Update patient notes with optimistic update
  const updatePatientNotes = useCallback(
    async (patientId: string, notes: string) => {
      if (!user?.id) return;

      // Find current patient
      const currentPatient = patients.find((p) => p.id === patientId);
      if (!currentPatient) return;

      // Optimistically update local state
      const updatedPatient = {
        ...currentPatient,
        notes: notes.trim() || undefined,
      };

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updatedPatient : p))
      );

      try {
        const { error } = await supabase
          .from("data")
          .update({ notes: notes.trim() || null } as any)
          .eq("patient_id", parseInt(patientId))
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating patient notes:", error);

        // Revert optimistic update on error
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? currentPatient : p))
        );

        toast({
          title: "Fehler beim Speichern",
          description: "Notizen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [user?.id, patients]
  );

  // Increment email sent count with optimistic update
  const incrementEmailSentCount = useCallback(
    async (patientId: string) => {
      if (!user?.id) return;

      // Find current patient
      const currentPatient = patients.find((p) => p.id === patientId);
      if (!currentPatient) return;

      const newCount = (currentPatient.emailSentCount || 0) + 1;

      // Optimistically update local state
      const updatedPatient = {
        ...currentPatient,
        emailSentCount: newCount,
        emailSentAt: new Date().toISOString(),
      };

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updatedPatient : p))
      );

      try {
        const { error } = await supabase
          .from("data")
          .update({
            email_sent_count: newCount,
            email_sent_at: new Date().toISOString(),
          } as any)
          .eq("patient_id", parseInt(patientId))
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error incrementing email sent count:", error);

        // Revert optimistic update on error
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? currentPatient : p))
        );

        toast({
          title: "Fehler beim Speichern",
          description: "E-Mail-Status konnte nicht gespeichert werden.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [user?.id, patients]
  );

  return {
    patients,
    loading,
    createPatient,
    movePatient,
    archivePatient,
    deleteArchivedPatients,
    updatePatientNotes,
    incrementEmailSentCount,
    refetch: fetchPatients,
  };
};
