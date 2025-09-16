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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
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
  const { user } = useAuth();

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

    if (!lastName.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte geben Sie den Nachnamen ein.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentifizierung erforderlich",
        description: "Sie müssen angemeldet sein, um einen Patienten anzulegen.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let pdfFilePath: string | undefined;

      // Upload PDF file if provided
      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('Cost_estimates')
          .upload(filePath, pdfFile);

        if (uploadError) {
          throw new Error(`Datei-Upload fehlgeschlagen: ${uploadError.message}`);
        }

        pdfFilePath = filePath;
      }

      // Insert patient data into database
      const { error: insertError } = await supabase
        .from('data')
        .insert({
          user_id: user.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim(),
          email: email.trim() || null,
          pdf_file_path: pdfFilePath || null,
          status: 'sent',
          archive_status: 'not_archived'
        });

      if (insertError) {
        // If database insert fails, clean up uploaded file
        if (pdfFilePath) {
          await supabase.storage
            .from('Cost_estimates')
            .remove([pdfFilePath]);
        }
        throw new Error(`Datenbank-Fehler: ${insertError.message}`);
      }

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPdfFile(null);
      onClose();
      onSubmit(); // Trigger data refresh

      toast({
        title: "Patient erstellt",
        description: "Der Patient wurde erfolgreich angelegt.",
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Beim Erstellen des Patienten ist ein Fehler aufgetreten.",
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
                E-Mail (optional)
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
              <Label className="text-sm font-medium">
                PDF-Dokument (optional)
              </Label>

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
