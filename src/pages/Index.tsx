import { KanbanBoard } from "@/components/KanbanBoard";
import { useAuth } from "@/hooks/useAuth";
import { usePatients } from "@/hooks/usePatients";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const {
    patients,
    loading,
    createPatient,
    movePatient,
    archivePatient,
    deleteArchivedPatients,
    updatePatientNotes,
    incrementEmailSentCount,
  } = usePatients();

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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <KanbanBoard
          patients={patients}
          loading={loading}
          onCreatePatient={createPatient}
          onMovePatient={movePatient}
          onArchivePatient={archivePatient}
          onUpdateNotes={updatePatientNotes}
          onIncrementEmailCount={incrementEmailSentCount}
          onDeleteArchived={deleteArchivedPatients}
        />
      </main>
    </div>
  );
};

export default Index;
