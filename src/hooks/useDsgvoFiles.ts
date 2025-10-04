import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

interface DsgvoFile {
  name: string;
  size: number;
  created_at: string;
  id: string;
}

export const useDsgvoFiles = () => {
  const [files, setFiles] = useState<DsgvoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("dsgvo_documents")
        .list();

      if (error) throw error;

      const fileList = data.map((file) => ({
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        id: file.id,
      }));

      setFiles(fileList);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from("dsgvo_documents")
        .upload(file.name, file, {
          upsert: true,
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Datei wurde hochgeladen",
      });

      await fetchFiles();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Datei konnte nicht hochgeladen werden",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from("dsgvo_documents")
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Datei wurde gelöscht",
      });

      await fetchFiles();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Datei konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("dsgvo_documents")
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Datei konnte nicht heruntergeladen werden",
        variant: "destructive",
      });
    }
  };

  const downloadAllAsZip = async () => {
    if (files.length === 0) {
      toast({
        title: "Keine Dateien",
        description: "Es gibt keine Dateien zum Herunterladen",
        variant: "destructive",
      });
      return;
    }

    try {
      const zip = new JSZip();

      for (const file of files) {
        const { data, error } = await supabase.storage
          .from("dsgvo_documents")
          .download(file.name);

        if (error) throw error;
        zip.file(file.name, data);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dsgvo_documents_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Erfolg",
        description: "ZIP-Datei wurde heruntergeladen",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "ZIP-Datei konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  return {
    files,
    loading,
    uploading,
    fetchFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    downloadAllAsZip,
  };
};
