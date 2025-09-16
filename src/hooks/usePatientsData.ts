import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';

export interface PatientData {
  patient_id: number;
  first_name: string | null;
  last_name: string;
  email: string | null;
  status: 'sent' | 'reminded' | 'appointment' | 'no_appointment';
  date_created: string;
  date_reminded: string | null;
  pdf_file_path: string | null;
  archive_status: 'archived' | 'not_archived';
  date_archived: string | null;
  appointment_made: boolean | null;
}

const supabaseUrl = "https://fjrdillreulrmtdtwnth.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcmRpbGxyZXVscm10ZHR3bnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODE1NzgsImV4cCI6MjA3MzU1NzU3OH0.dVE0ZPNoxayjR8q--_j_Jj8oIrHDt4ogOLIIWEmuo_Y";
const supabase = createClient(supabaseUrl, supabaseKey);

export function usePatientsData() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await supabase
        .from('data')
        .select('*')
        .eq('archive_status', 'not_archived')
        .order('date_created', { ascending: false });

      if (response.error) {
        console.error('Error fetching patients:', response.error);
        toast({
          title: "Fehler beim Laden",
          description: "Patientendaten konnten nicht geladen werden.",
          variant: "destructive",
        });
        return;
      }

      setPatients((response.data as PatientData[]) || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Patientendaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const movePatient = async (patientId: number, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'reminded') {
        updates.date_reminded = new Date().toISOString();
      }

      const response = await supabase
        .from('data')
        .update(updates)
        .eq('patient_id', patientId);

      if (response.error) {
        console.error('Error updating patient:', response.error);
        toast({
          title: "Fehler beim Aktualisieren",
          description: "Patient konnte nicht aktualisiert werden.",
          variant: "destructive",
        });
        return;
      }

      setPatients(prev => prev.map(patient => 
        patient.patient_id === patientId 
          ? { ...patient, ...updates }
          : patient
      ));

      toast({
        title: "Patient aktualisiert",
        description: "Status wurde erfolgreich geändert.",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const archivePatient = async (patientId: number, archiveType: string) => {
    try {
      const response = await supabase
        .from('data')
        .update({
          status: archiveType,
          archive_status: 'archived',
          date_archived: new Date().toISOString(),
        })
        .eq('patient_id', patientId);

      if (response.error) {
        console.error('Error archiving patient:', response.error);
        return;
      }

      setPatients(prev => prev.filter(patient => patient.patient_id !== patientId));
    } catch (error) {
      console.error('Error archiving patient:', error);
    }
  };

  const getArchivedCount = async (archiveType: string): Promise<number> => {
    try {
      const response = await supabase
        .from('data')
        .select('patient_id')
        .eq('archive_status', 'archived')
        .eq('status', archiveType);

      if (response.error) {
        return 0;
      }

      return response.data?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return {
    patients,
    loading,
    fetchPatients,
    movePatient,
    archivePatient,
    getArchivedCount,
  };
}