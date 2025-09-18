import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Patient } from "@/types/patient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load patients from Supabase
  const loadPatients = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('data')
        .select('*')
        .eq('user_id', user.id)
        .order('date_created', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedPatients: Patient[] = data.map(row => {
        return {
          id: row.patient_id.toString(),
          name: row.first_name ? `${row.first_name} ${row.last_name}` : row.last_name,
          email: row.email || undefined,
          status: row.status as Patient["status"],
          createdAt: row.date_created,
          movedAt: row.date_reminded || undefined,
          pdfFile: row.pdf_file_path ? { name: row.pdf_file_path.split('/').pop() || 'Document.pdf' } : undefined
        };
      });

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Die Patientendaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [user?.id]);

  const handleCreatePatient = () => {
    loadPatients(); // Refresh data after creating patient
  };

  const handleMovePatient = async (
    patientId: string,
    newStatus: Patient["status"]
  ) => {
    if (!user?.id) return;

    try {
      const updates: any = { status: newStatus };
      
      // Update reminded timestamp when moving to "reminded"
      if (newStatus === "reminded") {
        updates.date_reminded = new Date().toISOString();
      }

      const { error } = await supabase
        .from('data')
        .update(updates)
        .eq('patient_id', parseInt(patientId))
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setPatients((prev) =>
        prev.map((patient) => {
          if (patient.id === patientId) {
            const localUpdates: Partial<Patient> = { status: newStatus };
            if (newStatus === "reminded") {
              localUpdates.movedAt = new Date().toISOString();
            }
            return { ...patient, ...localUpdates };
          }
          return patient;
        })
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Der Patientenstatus konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleArchivePatient = async (
    patientId: string,
    archiveType: "terminated" | "no_response"
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('data')
        .update({ 
          status: archiveType as any, // Cast to handle enum update
          archive_status: 'archived',
          date_archived: new Date().toISOString()
        })
        .eq('patient_id', parseInt(patientId))
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === patientId ? { ...patient, status: archiveType } : patient
        )
      );
    } catch (error) {
      console.error('Error archiving patient:', error);
      toast({
        title: "Fehler beim Archivieren",
        description: "Der Patient konnte nicht archiviert werden.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span className="font-medium">Willkommen</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Lade Patientendaten...</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            patients={patients}
            onCreatePatient={handleCreatePatient}
            onMovePatient={handleMovePatient}
            onArchivePatient={handleArchivePatient}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
