import { useState, useEffect, useCallback } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Patient } from "@/types/patient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const Index = () => {
  const { user, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Convert database row to Patient object
  const formatPatient = useCallback((row: any): Patient => {
    console.log('Formatting patient:', row);
    return {
      id: row.patient_id?.toString() || row.id?.toString() || 'temp-id',
      name: row.first_name ? `${row.first_name} ${row.last_name}` : row.last_name,
      email: row.email || undefined,
      status: row.status as Patient["status"],
      createdAt: row.date_created,
      movedAt: row.date_reminded || undefined,
      pdfFile: row.pdf_file_path ? { name: row.pdf_file_path.split('/').pop() || 'Document.pdf' } : undefined
    };
  }, []);

  // Load patients from Supabase
  const loadPatients = useCallback(async () => {
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

      const formattedPatients: Patient[] = data.map(formatPatient);
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
  }, [user?.id, formatPatient]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id || realtimeChannel) return;

    const channel = supabase
      .channel('patient-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'data',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              console.log('INSERT payload:', payload.new);
              const newPatient = formatPatient(payload.new);
              console.log('Formatted new patient:', newPatient);
              setPatients(prev => {
                console.log('Previous patients:', prev);
                const updated = [...prev, newPatient];
                console.log('Updated patients:', updated);
                return updated;
              });
              break;
              
            case 'UPDATE':
              const updatedPatient = formatPatient(payload.new);
              setPatients(prev => prev.map(p => 
                p.id === updatedPatient.id ? updatedPatient : p
              ));
              break;
              
            case 'DELETE':
              const deletedId = payload.old.patient_id.toString();
              setPatients(prev => prev.filter(p => p.id !== deletedId));
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    setRealtimeChannel(channel);
  }, [user?.id, realtimeChannel, formatPatient]);

  // Load initial data and setup realtime
  useEffect(() => {
    loadPatients();
    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [loadPatients, setupRealtimeSubscription, realtimeChannel]);

  const handleCreatePatient = useCallback(() => {
    // Real-time subscription will handle the new patient update
    // No need to manually refresh here
  }, []);

  // Optimistic UI update for moving patients
  const handleMovePatient = useCallback(async (
    patientId: string,
    newStatus: Patient["status"]
  ) => {
    if (!user?.id) return;

    // Optimistic update - immediately update local state
    const optimisticUpdate = {
      status: newStatus,
      movedAt: newStatus === "reminded" ? new Date().toISOString() : undefined
    };

    setPatients(prev => prev.map(patient => 
      patient.id === patientId 
        ? { ...patient, ...optimisticUpdate }
        : patient
    ));

    // Background database update
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === "reminded") {
        updates.date_reminded = new Date().toISOString();
      }

      const { error } = await supabase
        .from('data')
        .update(updates)
        .eq('patient_id', parseInt(patientId))
        .eq('user_id', user.id);

      if (error) {
        // Revert optimistic update on error
        setPatients(prev => prev.map(patient => 
          patient.id === patientId 
            ? { ...patient, status: patient.status, movedAt: patient.movedAt }
            : patient
        ));
        
        throw error;
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Der Patientenstatus konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  }, [user?.id]);

  // Optimistic UI update for archiving patients
  const handleArchivePatient = useCallback(async (
    patientId: string,
    archiveType: "terminated" | "no_response"
  ) => {
    if (!user?.id) return;

    // Optimistic update - immediately update local state
    setPatients(prev => prev.map(patient =>
      patient.id === patientId 
        ? { ...patient, status: archiveType }
        : patient
    ));

    // Background database update
    try {
      const { error } = await supabase
        .from('data')
        .update({ 
          status: archiveType as any,
          archive_status: 'archived',
          date_archived: new Date().toISOString()
        })
        .eq('patient_id', parseInt(patientId))
        .eq('user_id', user.id);

      if (error) {
        // Revert optimistic update on error
        setPatients(prev => prev.map(patient =>
          patient.id === patientId 
            ? { ...patient, status: patient.status }
            : patient
        ));
        
        throw error;
      }
    } catch (error) {
      console.error('Error archiving patient:', error);
      toast({
        title: "Fehler beim Archivieren",
        description: "Der Patient konnte nicht archiviert werden.",
        variant: "destructive",
      });
    }
  }, [user?.id]);

  const handleSignOut = useCallback(async () => {
    try {
      // Cleanup realtime subscription before signing out
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
      
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
  }, [signOut, realtimeChannel]);

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
