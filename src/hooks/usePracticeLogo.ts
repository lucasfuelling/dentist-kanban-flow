import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export const usePracticeLogo = () => {
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Bitte wählen Sie eine PNG, JPG, JPEG oder SVG Datei';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Die Datei darf maximal 2MB groß sein';
    }
    return null;
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('practice_assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('practice_assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Fehler beim Hochladen des Logos');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteLogo = async (logoUrl: string): Promise<boolean> => {
    try {
      const fileName = logoUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await supabase.storage
        .from('practice_assets')
        .remove([fileName]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Fehler beim Löschen des Logos');
      return false;
    }
  };

  return {
    uploadLogo,
    deleteLogo,
    uploading
  };
};
