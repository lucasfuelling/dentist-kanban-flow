import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Plus, Archive, XCircle, CheckCircle2, Filter } from "lucide-react";
import { PatientCardData } from "./PatientCardData";
import { PatientFormModal } from "./PatientFormModal";
import { ArchiveBox } from "./ArchiveBox";
import { LogoutButton } from "./LogoutButton";
import { PatientData } from "@/hooks/usePatientsData";
import logo from "@/assets/logo.png";

interface KanbanBoardDataProps {
  patients: PatientData[];
  onCreatePatient: () => void;
  onMovePatient: (patientId: number, newStatus: string) => void;
  onArchivePatient: (
    patientId: number,
    archiveType: string
  ) => void;
  getArchivedCount: (archiveType: string) => Promise<number>;
}

export function KanbanBoardData({
  patients,
  onCreatePatient,
  onMovePatient,
  onArchivePatient,
  getArchivedCount,
}: KanbanBoardDataProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [noAppointmentCount, setNoAppointmentCount] = useState(0);
  const [lastArchived, setLastArchived] = useState<{
    patient: PatientData;
    prevStatus: PatientData["status"];
    archiveType: "appointment" | "no_appointment";
  } | null>(null);

  // Load archived counts
  useEffect(() => {
    const loadArchivedCounts = async () => {
      const [appointmentCountResult, noAppointmentCountResult] = await Promise.all([
        getArchivedCount("appointment"),
        getArchivedCount("no_appointment"),
      ]);
      setAppointmentCount(appointmentCountResult);
      setNoAppointmentCount(noAppointmentCountResult);
    };
    
    loadArchivedCounts();
  }, [getArchivedCount]);

  const sortPatients = (patientList: PatientData[]) => {
    return [...patientList].sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.first_name || ''} ${a.last_name}`.trim();
        const nameB = `${b.first_name || ''} ${b.last_name}`.trim();
        return nameA.localeCompare(nameB);
      }
      // Default: sort by date (oldest first)
      return new Date(a.date_created).getTime() - new Date(b.date_created).getTime();
    });
  };

  const sentPatients = sortPatients(
    patients.filter((p) => p.status === "sent")
  );
  const remindedPatients = sortPatients(
    patients.filter((p) => p.status === "reminded")
  );
  const appointmentPatients = sortPatients(
    patients.filter((p) => p.status === "appointment")
  );
  const noAppointmentPatients = sortPatients(
    patients.filter((p) => p.status === "no_appointment")
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const patientId = parseInt(draggableId);

    // Handle archive drops
    if (destination.droppableId === "archive-appointment") {
      handleArchivePatient(patientId, "appointment");
      return;
    }

    if (destination.droppableId === "archive-no-appointment") {
      handleArchivePatient(patientId, "no_appointment");
      return;
    }

    // Handle column moves
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as PatientData["status"];
      onMovePatient(patientId, newStatus);
    }
  };

  const handleArchivePatient = (
    patientId: number,
    archiveType: "appointment" | "no_appointment"
  ) => {
    const patient = patients.find((p) => p.patient_id === patientId);
    if (!patient) return;
    
    const archived = { patient, prevStatus: patient.status, archiveType };
    setLastArchived(archived);
    onArchivePatient(patientId, archiveType);

    // Update counts
    if (archiveType === "appointment") {
      setAppointmentCount(prev => prev + 1);
    } else {
      setNoAppointmentCount(prev => prev + 1);
    }

    // Show the toast with undo option
    const patientName = `${patient.first_name || ''} ${patient.last_name}`.trim();
    const toastController = toast({
      title: "Archiviert",
      description: `${patientName} wurde archiviert.`,
      action: (
        <button
          onClick={() => {
            onMovePatient(archived.patient.patient_id, archived.prevStatus);
            toastController.dismiss();
            // Update counts back
            if (archiveType === "appointment") {
              setAppointmentCount(prev => prev - 1);
            } else {
              setNoAppointmentCount(prev => prev - 1);
            }
          }}
          className="ml-4 underline text-primary"
        >
          Rückgängig
        </button>
      ),
      duration: 3000,
    });
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    onCreatePatient();
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
                          key={patient.patient_id}
                          draggableId={patient.patient_id.toString()}
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
                              <PatientCardData patient={patient} />
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
                          key={patient.patient_id}
                          draggableId={patient.patient_id.toString()}
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
                              <PatientCardData patient={patient} />
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

            {/* Terminiert Column */}
            <div className="flex-1">
              <div className="bg-kanban-column rounded-lg p-4 h-fit">
                <h2 className="font-semibold text-foreground mb-4 flex items-center">
                  Terminiert
                  <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                    {appointmentPatients.length}
                  </span>
                </h2>

                <Droppable droppableId="appointment">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent/20" : ""
                      }`}
                    >
                      {appointmentPatients.map((patient, index) => (
                        <Draggable
                          key={patient.patient_id}
                          draggableId={patient.patient_id.toString()}
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
                              <PatientCardData patient={patient} />
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

            {/* Rückmeldung Column */}
            <div className="flex-1">
              <div className="bg-kanban-column rounded-lg p-4 h-fit">
                <h2 className="font-semibold text-foreground mb-4 flex items-center">
                  Rückmeldung
                  <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                    {noAppointmentPatients.length}
                  </span>
                </h2>

                <Droppable droppableId="no_appointment">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent/20" : ""
                      }`}
                    >
                      {noAppointmentPatients.map((patient, index) => (
                        <Draggable
                          key={patient.patient_id}
                          draggableId={patient.patient_id.toString()}
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
                              <PatientCardData patient={patient} />
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
              id="archive-appointment"
              title="Terminiert"
              count={appointmentCount}
              icon={CheckCircle2}
              variant="success"
            />

            <ArchiveBox
              id="archive-no-appointment"
              title="Keine Rückmeldung"
              count={noAppointmentCount}
              icon={XCircle}
              variant="error"
            />
          </div>
        </div>
      </DragDropContext>

      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}