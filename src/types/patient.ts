export type PatientStatus = 'sent' | 'reminded' | 'appointment' | 'no_appointment' | 'terminated' | 'no_response';

export interface Patient {
  id: string;
  name: string;
  email?: string;
  pdfUrl?: string;
  pdfFilePath?: string;
  status: PatientStatus;
  createdAt: string;
  movedAt?: string; // When moved to "reminded" status
}