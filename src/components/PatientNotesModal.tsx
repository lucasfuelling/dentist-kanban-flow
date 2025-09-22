import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Patient } from "@/types/patient";

interface PatientNotesModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientId: string, notes: string) => void;
}

export function PatientNotesModal({ patient, isOpen, onClose, onSave }: PatientNotesModalProps) {
  const [notes, setNotes] = useState(patient.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(patient.id, notes);
      onClose();
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNotes(patient.notes || "");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notizen für {patient.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notizen eingeben..."
            className="min-h-[120px] resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}