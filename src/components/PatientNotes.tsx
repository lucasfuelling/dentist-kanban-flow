import { useState, useCallback, useEffect } from "react";
import { Expand } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PatientNotesProps {
  notes?: string;
  onNotesChange: (notes: string) => void;
  patientName: string;
}

export function PatientNotes({ notes = "", onNotesChange, patientName }: PatientNotesProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNotes, setModalNotes] = useState(notes);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((value: string) => {
      onNotesChange(value);
    }, 500),
    [onNotesChange]
  );

  // Update local state when props change
  useEffect(() => {
    setLocalNotes(notes);
    setModalNotes(notes);
  }, [notes]);

  const handleInlineNotesChange = (value: string) => {
    setLocalNotes(value);
    debouncedSave(value);
  };

  const handleModalSave = () => {
    setLocalNotes(modalNotes);
    onNotesChange(modalNotes);
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setModalNotes(localNotes);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <Textarea
          value={localNotes}
          onChange={(e) => handleInlineNotesChange(e.target.value)}
          placeholder="Notiz hinzufügen..."
          className="min-h-[32px] h-8 py-1 px-2 text-xs resize-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
          rows={1}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Expand className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notizen für {patientName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="Notizen für diesen Patienten eingeben..."
              className="min-h-[200px] resize-y"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleModalCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleModalSave}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}