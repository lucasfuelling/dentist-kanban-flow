import { useState, useCallback, useEffect, useRef } from "react";
import { Expand, Plus } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    // Exit editing mode if notes become empty
    if (!notes && isEditing) {
      setIsEditing(false);
    }
  }, [notes, isEditing]);

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

  const handleAddNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    // Focus the textarea after state update
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleNotesBlur = () => {
    if (!localNotes.trim()) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (!notes) {
        setLocalNotes('');
        setIsEditing(false);
      }
      textareaRef.current?.blur();
    }
  };

  // Determine what to show
  const hasNotes = Boolean(notes?.trim());
  const showNotesField = hasNotes || isEditing;

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        {!showNotesField ? (
          // Show "Add Note" button when no notes exist and not editing
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:bg-muted flex items-center gap-1"
            onClick={handleAddNoteClick}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Plus className="h-3 w-3" />
            Notiz hinzufügen
          </Button>
        ) : (
          // Show textarea and expand button when editing or has notes
          <>
            <Textarea
              ref={textareaRef}
              value={localNotes}
              onChange={(e) => handleInlineNotesChange(e.target.value)}
              onBlur={handleNotesBlur}
              onKeyDown={handleKeyDown}
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
          </>
        )}
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