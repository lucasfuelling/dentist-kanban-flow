import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Patient } from "@/types/patient";

const Index = () => {
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

  return (
    <KanbanBoard
      patients={patients}
      onCreatePatient={handleCreatePatient}
      onMovePatient={handleMovePatient}
      onArchivePatient={handleArchivePatient}
    />
  );
};

export default Index;