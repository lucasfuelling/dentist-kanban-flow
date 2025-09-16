import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Plus, Archive, XCircle, CheckCircle2, Filter } from "lucide-react";
import { PatientCard } from "./PatientCard";
import { PatientFormModal } from "./PatientFormModal";
import { ArchiveBox } from "./ArchiveBox";
import { LogoutButton } from "./LogoutButton";
import { Patient } from "@/types/patient";
import logo from "@/assets/logo.png";

interface KanbanBoardProps {
  patients: Patient[];
  onCreatePatient: (
    patient: Omit<Patient, "id" | "createdAt" | "movedAt">
  ) => void;
  onMovePatient: (patientId: string, newStatus: Patient["status"]) => void;
  onArchivePatient: (
    patientId: string,
    archiveType: "terminated" | "no_response"
  ) => void;
}

export function KanbanBoard({
  patients,
  onCreatePatient,
  onMovePatient,
  onArchivePatient,
}: KanbanBoardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [lastArchived, setLastArchived] = useState<{
    patient: Patient;
    prevStatus: Patient["status"];
    archiveType: "terminated" | "no_response";
  } | null>(null);

  const sortPatients = (patientList: Patient[]) => {
    return [...patientList].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      // Default: sort by date (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const sentPatients = sortPatients(
    patients.filter((p) => p.status === "sent")
  );
  const remindedPatients = sortPatients(
    patients.filter((p) => p.status === "reminded")
  );
  const terminatedCount = patients.filter(
    (p) => p.status === "terminated"
  ).length;
  const noResponseCount = patients.filter(
    (p) => p.status === "no_response"
  ).length;

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Handle archive drops
    if (destination.droppableId === "archive-terminated") {
      handleArchivePatient(draggableId, "terminated");
      return;
    }

    if (destination.droppableId === "archive-no-response") {
      handleArchivePatient(draggableId, "no_response");
      return;
    }

    // Handle column moves
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as Patient["status"];
      onMovePatient(draggableId, newStatus);
    }
  };

  const handleArchivePatient = (
    patientId: string,
    archiveType: "terminated" | "no_response"
  ) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    const archived = { patient, prevStatus: patient.status, archiveType };
    setLastArchived(archived);
    onArchivePatient(patientId, archiveType);

    // Show the toast and get its controller object
    const toastController = toast({
      title: "Archiviert",
      description: `${patient.name} wurde archiviert.`,
      action: (
        <button
          onClick={() => {
            onMovePatient(archived.patient.id, archived.prevStatus);
            toastController.dismiss(); // Dismiss the toast after undo
          }}
          className="ml-4 underline text-primary"
        >
          Rückgängig
        </button>
      ),
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Logo"
                className="h-16 w-16 object-contain rounded bg-white shadow"
              />
              <div>
                <h1 className="lg:text-2xl text-xl font-bold text-foreground mb-2">
                  Zahnarztpraxis Dr. Leue
                </h1>
                <p className="text-muted-foreground">
                  Kostenvoranschlag Übersicht
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LogoutButton />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === "date" ? "name" : "date")}
                className="bg-card hover:bg-accent"
              >
                <Filter className="h-4 w-4 mr-2" />
                {sortBy === "date" ? "Nach Datum" : "Nach Name"}
              </Button>

              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neuen Patient anlegen
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Kanban Columns */}
          <div className="flex gap-6 flex-1">
            {/* Verschickt Column */}
            <div className="flex-1">
              <div className="bg-kanban-column rounded-lg p-4 h-fit">
                <h2 className="font-semibold text-foreground mb-4 flex items-center">
                  Verschickt
                  <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                    {sentPatients.length}
                  </span>
                </h2>

                <Droppable droppableId="sent">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent/20" : ""
                      }`}
                    >
                      {sentPatients.map((patient, index) => (
                        <Draggable
                          key={patient.id}
                          draggableId={patient.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging ? "rotate-2 scale-105" : ""
                              }`}
                            >
                              <PatientCard patient={patient} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Erinnert Column */}
            <div className="flex-1">
              <div className="bg-kanban-column rounded-lg p-4 h-fit">
                <h2 className="font-semibold text-foreground mb-4 flex items-center">
                  Erinnert
                  <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                    {remindedPatients.length}
                  </span>
                </h2>

                <Droppable droppableId="reminded">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent/20" : ""
                      }`}
                    >
                      {remindedPatients.map((patient, index) => (
                        <Draggable
                          key={patient.id}
                          draggableId={patient.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging ? "rotate-2 scale-105" : ""
                              }`}
                            >
                              <PatientCard patient={patient} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>

          {/* Archive Boxes */}
          <div className="w-64 space-y-4">
            <ArchiveBox
              id="archive-terminated"
              title="Terminiert"
              count={terminatedCount}
              icon={CheckCircle2}
              variant="success"
            />

            <ArchiveBox
              id="archive-no-response"
              title="Keine Rückmeldung"
              count={noResponseCount}
              icon={XCircle}
              variant="error"
            />
          </div>
        </div>
      </DragDropContext>

      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={onCreatePatient}
      />
    </div>
  );
}
