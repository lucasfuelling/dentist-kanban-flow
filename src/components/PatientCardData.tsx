import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Mail, FileText } from "lucide-react";
import { PatientData } from "@/hooks/usePatientsData";

interface PatientCardDataProps {
  patient: PatientData;
}

export function PatientCardData({ patient }: PatientCardDataProps) {
  const calculateDaysSince = (date: string) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Use date_reminded if available, otherwise use date_created
  const relevantDate = patient.date_reminded || patient.date_created;
  const daysSince = calculateDaysSince(relevantDate);
  
  const patientName = `${patient.first_name || ''} ${patient.last_name}`.trim();

  return (
    <Card className="bg-card hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Patient Name */}
          <div>
            <h3 className="font-medium text-card-foreground leading-tight">
              {patientName}
            </h3>
          </div>

          {/* Email */}
          {patient.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}

          {/* PDF File */}
          {patient.pdf_file_path && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">PDF verfügbar</span>
            </div>
          )}

          {/* Date Information */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {patient.date_reminded ? 'Erinnert vor' : 'Erstellt vor'} {daysSince} Tag{daysSince !== 1 ? 'en' : ''}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex justify-end">
            <span className={`text-xs px-2 py-1 rounded-full ${
              patient.status === 'sent' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {patient.status === 'sent' ? 'Versendet' : 'Erinnert'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}