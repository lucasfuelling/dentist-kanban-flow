import { FileText, Mail, Calendar, BellRing, MoveRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Patient } from "@/types/patient";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
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
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {patient.name}
          </h3>
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
          <Calendar className="h-3 w-3 mr-1" />
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

        {patient.pdfFile && (
          <div className="flex items-center text-primary text-xs">
            <FileText className="h-3 w-3 mr-1" />
            <a
              href={
                patient.pdfFile instanceof File 
                  ? URL.createObjectURL(patient.pdfFile)
                  : `https://fjrdillreulrmtdtwnth.supabase.co/storage/v1/object/public/Cost_estimates/${patient.pdfFile.name}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="truncate max-w-[80px] underline hover:text-primary/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {patient.pdfFile.name}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
