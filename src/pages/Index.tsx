import { usePatientsData, PatientData } from "@/hooks/usePatientsData";
import { KanbanBoardData } from "@/components/KanbanBoardData";

const Index = () => {
  const { 
    patients, 
    loading, 
    fetchPatients, 
    movePatient, 
    archivePatient, 
    getArchivedCount 
  } = usePatientsData();

  const handleCreatePatient = () => {
    // Refresh the data after creating a patient
    fetchPatients();
  };

  const handleMovePatient = (patientId: number, newStatus: string) => {
    movePatient(patientId, newStatus);
  };

  const handleArchivePatient = (patientId: number, archiveType: string) => {
    archivePatient(patientId, archiveType);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Patientendaten...</p>
        </div>
      </div>
    );
  }

  return (
    <KanbanBoardData
      patients={patients}
      onCreatePatient={handleCreatePatient}
      onMovePatient={handleMovePatient}
      onArchivePatient={handleArchivePatient}
      getArchivedCount={getArchivedCount}
    />
  );
};

export default Index;