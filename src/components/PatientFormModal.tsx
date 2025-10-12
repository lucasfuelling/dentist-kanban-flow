import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const patientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(100, "Vorname darf maximal 100 Zeichen lang sein")
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, "Nachname ist erforderlich")
    .max(100, "Nachname darf maximal 100 Zeichen lang sein"),
  email: z
    .string()
    .trim()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail darf maximal 255 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patient: {
    name: string;
    email?: string;
    pdfFile?: File;
  }) => Promise<void>;
}

export function PatientFormModal({
  isOpen,
  onClose,
  onSubmit,
}: PatientFormModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine PDF-Datei aus.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "Datei zu groß",
          description: "Die Datei darf maximal 10MB groß sein.",
          variant: "destructive",
        });
        return;
      }

      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      const validated = patientSchema.parse({
        firstName,
        lastName,
        email: email || "",
      });

      setIsSubmitting(true);

      await onSubmit({
        name: validated.firstName
          ? `${validated.firstName} ${validated.lastName}`
          : validated.lastName,
        email: validated.email || undefined,
        pdfFile: pdfFile || undefined,
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPdfFile(null);
      onClose();

      toast({
        title: "Patient erstellt",
        description: "Der Patient wurde erfolgreich angelegt.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validierungsfehler",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Fehler",
        description: "Beim Erstellen des Patienten ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPdfFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Neuen Patient anlegen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  Vorname
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Vorname"
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nachname"
                  className="w-full"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">PDF-Dokument</Label>

              {!pdfFile ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      PDF-Datei hochladen
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Max. 10MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{pdfFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPdfFile(null)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !lastName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Wird erstellt..." : "Patient anlegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
