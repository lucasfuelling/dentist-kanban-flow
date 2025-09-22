import {
  FileText,
  Mail,
  BellRing,
  MoveRight,
  SendHorizontal,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Patient } from "@/types/patient";
import { PatientNotesModal } from "./PatientNotesModal";

interface PatientCardProps {
  patient: Patient;
  onUpdateNotes: (patientId: string, notes: string) => void;
}

export function PatientCard({ patient, onUpdateNotes }: PatientCardProps) {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const calculateDaysSince = (date: string) => {
    const targetDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const relevantDate =
    patient.status === "reminded" && patient.movedAt
      ? patient.movedAt
      : patient.createdAt;

  const daysSince = calculateDaysSince(relevantDate);

  return (
    <Card className="bg-kanban-card hover:bg-kanban-card-hover border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {patient.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsNotesModalOpen(true);
              }}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/5"
              title="Notizen bearbeiten"
            >
              <StickyNote className="h-3 w-3" />
            </button>
          </div>
          {patient.notes && (
            <div className="text-destructive text-xs mt-1 truncate">
              {patient.notes}
            </div>
          )}
          {patient.email && (
            <div className="flex items-center text-muted-foreground text-xs mt-1">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 ml-2">
          <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
            {daysSince} Tag{daysSince !== 1 ? "e" : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-muted-foreground text-xs">
          <SendHorizontal className="h-3 w-3 mr-1" />
          <span>{new Date(patient.createdAt).toLocaleDateString("de-DE")}</span>
          {patient.status === "reminded" && patient.movedAt && (
            <>
              <MoveRight className="h-3 w-3 mx-2 text-muted-foreground" />
              <BellRing className="h-3 w-3 mr-1" />
              <span>
                {new Date(patient.movedAt).toLocaleDateString("de-DE")}
              </span>
            </>
          )}
        </div>

        {patient.pdfUrl && (
          <a
            href={patient.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // Open immediately to preserve user gesture context
              window.open(patient.pdfUrl, '_blank', 'noopener,noreferrer');
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            className="flex items-center text-primary text-xs hover:text-primary/80 transition-colors p-1 rounded hover:bg-primary/5 cursor-pointer"
            title="PDF öffnen"
          >
            <FileText className="h-3 w-3 mr-1" />
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <PatientNotesModal
        patient={patient}
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        onSave={onUpdateNotes}
      />
    </Card>
  );
}
