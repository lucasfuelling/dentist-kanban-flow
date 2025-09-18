export interface Patient {
  id: string;
  name: string;
  email?: string;
  pdfFile?: File;
  status: 'sent' | 'reminded' | 'terminated' | 'no_response';
  createdAt: string;
  movedAt?: string; // When moved to "reminded" status
}