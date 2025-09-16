import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Patient } from "@/types/patient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { user, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([
    // Sample data for demonstration
    {
      id: "1",
      name: "Max Mustermann",
      email: "max.mustermann@email.com",
      status: "sent",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      id: "2", 
      name: "Anna Schmidt",
      status: "sent",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      id: "3",
      name: "Peter Weber",
      email: "peter@example.com",
      status: "reminded",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      movedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // moved 3 days ago
    },
  ]);

  const handleCreatePatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'movedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    
    setPatients(prev => [...prev, newPatient]);
  };

  const handleMovePatient = (patientId: string, newStatus: Patient['status']) => {
    setPatients(prev => prev.map(patient => {
      if (patient.id === patientId) {
        const updates: Partial<Patient> = { status: newStatus };
        
        // Reset counter when moving to "reminded"
        if (newStatus === 'reminded') {
          updates.movedAt = new Date().toISOString();
        }
        
        return { ...patient, ...updates };
      }
      return patient;
    }));
  };

  const handleArchivePatient = (patientId: string, archiveType: 'terminated' | 'no_response') => {
    setPatients(prev => prev.map(patient => 
      patient.id === patientId 
        ? { ...patient, status: archiveType }
        : patient
    ));
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
            <span className="font-medium">Welcome, {user?.email}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <KanbanBoard
          patients={patients}
          onCreatePatient={handleCreatePatient}
          onMovePatient={handleMovePatient}
          onArchivePatient={handleArchivePatient}
        />
      </main>
    </div>
  );
};

export default Index;