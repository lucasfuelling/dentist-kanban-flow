import {
  FileText,
  Mail,
  BellRing,
  MoveRight,
  SendHorizontal,
  ExternalLink,
  StickyNote,
  Loader2,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Patient } from "@/types/patient";
import { PatientNotesModal } from "./PatientNotesModal";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useToast } from "@/hooks/use-toast";

interface PatientCardProps {
  patient: Patient;
  onUpdateNotes: (patientId: string, notes: string) => void;
  onIncrementEmailCount?: (patientId: string) => void;
  onMovePatient?: (patientId: string, newStatus: Patient["status"]) => void;
}

export function PatientCard({
  patient,
  onUpdateNotes,
  onIncrementEmailCount,
  onMovePatient,
}: PatientCardProps) {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { configuration } = useConfiguration();
  const { toast } = useToast();

  const truncateNotes = (notes: string, maxLength: number = 40) => {
    if (!notes) return notes;
    if (notes.length <= maxLength) return notes;
    return notes.substring(0, maxLength) + "...";
  };

  const calculateDaysSince = (date: string) => {
    const targetDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSendEmail = async () => {
    if (patient.emailSentCount >= 2) {
      toast({
        variant: "destructive",
        title: "Email limit reached",
        description: "Maximum of 2 emails can be sent to this patient.",
      });
      return;
    }

    if (!configuration?.webhook_url || !configuration?.email_template) {
      toast({
        variant: "destructive",
        title: "Configuration missing",
        description:
          "Please configure webhook URL and email template in settings.",
      });
      return;
    }

    if (!patient.email) {
      toast({
        variant: "destructive",
        title: "No email address",
        description: "This patient doesn't have an email address.",
      });
      return;
    }

    try {
      setSendingEmail(true);

      // Replace placeholders in email template
      const nameParts = patient.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const emailText = configuration.email_template
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{lastName\}\}/g, lastName)
        .replace(/\{\{email\}\}/g, patient.email || "");

      const response = await fetch(configuration.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: patient.email,
          emailText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Email sent",
        description: `Email sent successfully to ${patient.email}`,
      });

      // Increment email sent count in database
      if (onIncrementEmailCount) {
        onIncrementEmailCount(patient.id);
      }

      // Move patient to "reminded" status
      if (onMovePatient) {
        onMovePatient(patient.id, "reminded");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: "Error sending email",
        description: "There was a problem sending the email.",
      });
    } finally {
      setSendingEmail(false);
    }
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
            <div className="text-destructive text-xs mt-1">
              {truncateNotes(patient.notes, 35)}
            </div>
          )}
          {patient.email && (
            <div className="flex text-muted-foreground text-xs mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendEmail();
                }}
                disabled={sendingEmail || patient.emailSentCount >= 2}
                className="flex items-center hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  patient.emailSentCount >= 2
                    ? "Maximum emails sent (2/2)"
                    : "Send email to patient"
                }
              >
                {sendingEmail ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Mail className="h-3 w-3 mr-1" />
                )}
                <span className="truncate">{patient.email}</span>
              </button>
              {patient.emailSentCount > 0 && (
                <div className="flex items-center ml-1">
                  <Check className="h-4 w-4 text-green-600" />
                  {patient.emailSentCount >= 2 && (
                    <Check className="h-4 w-4 text-green-600 -ml-2" />
                  )}
                </div>
              )}
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
              window.open(patient.pdfUrl, "_blank", "noopener,noreferrer");
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
