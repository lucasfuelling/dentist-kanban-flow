import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PatientInsertData {
  first_name: string;
  last_name: string;
  email?: string;
  pdf_file_path?: string;
  date_reminded?: string;
  archive_status?: 'archived' | 'not_archived';
  appointment_made?: boolean;
}

export interface PatientInsertResult {
  success: boolean;
  data?: any;
  error?: string;
  recordId?: number;
}

export const usePatients = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePatientData = (data: PatientInsertData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check mandatory fields
    if (!data.first_name?.trim()) {
      errors.push('Vorname ist erforderlich');
    }
    if (!data.last_name?.trim()) {
      errors.push('Nachname ist erforderlich');
    }
    if (!data.email?.trim()) {
      errors.push('E-Mail ist erforderlich');
    }

    // Validate email format if provided
    if (data.email && !validateEmail(data.email)) {
      errors.push('Ungültiges E-Mail-Format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const insertPatient = async (patientData: PatientInsertData): Promise<PatientInsertResult> => {
    setLoading(true);

    try {
      // Validate input data
      const validation = validatePatientData(patientData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        toast({
          title: 'Validierungsfehler',
          description: errorMessage,
          variant: 'destructive',
        });
        return {
          success: false,
          error: errorMessage
        };
      }

      // Prepare data for insertion (date_created will be auto-set by DB)
      const insertData = {
        first_name: patientData.first_name.trim(),
        last_name: patientData.last_name.trim(),
        email: patientData.email?.trim(),
        pdf_file_path: patientData.pdf_file_path,
        date_reminded: patientData.date_reminded,
        archive_status: patientData.archive_status || 'not_archived',
        appointment_made: patientData.appointment_made || false,
      };

      // Insert into Supabase
      const { data, error } = await (supabase as any)
        .from('data')
        .insert(insertData)
        .select('patient_id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: 'Datenbankfehler',
          description: 'Fehler beim Speichern in die Datenbank: ' + error.message,
          variant: 'destructive',
        });
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        toast({
          title: 'Fehler',
          description: 'Keine Daten von der Datenbank erhalten',
          variant: 'destructive',
        });
        return {
          success: false,
          error: 'Keine Daten erhalten'
        };
      }

      toast({
        title: 'Patient erfolgreich erstellt',
        description: `Patient wurde mit ID ${data.patient_id} erstellt`,
      });

      return {
        success: true,
        data: data,
        recordId: data.patient_id
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error inserting patient:', error);
      
      toast({
        title: 'Fehler',
        description: 'Unerwarteter Fehler beim Erstellen des Patienten: ' + errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    insertPatient,
    loading,
    validateEmail,
    validatePatientData
  };
};