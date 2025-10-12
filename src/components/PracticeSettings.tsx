import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfiguration } from "@/hooks/useConfiguration";
import { usePracticeLogo } from "@/hooks/usePracticeLogo";
import logoPlaceholder from "@/assets/logo.png";

export const PracticeSettings = () => {
  const { configuration, loading, updateConfiguration } = useConfiguration();
  const { uploadLogo, deleteLogo, uploading } = usePracticeLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dentistName, setDentistName] = useState(
    configuration?.dentist_name || "Dr. Boede"
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let newLogoUrl = configuration?.logo_url || null;

      // Upload new logo if selected
      if (selectedFile) {
        const uploadedUrl = await uploadLogo(selectedFile);
        if (!uploadedUrl) {
          setSaving(false);
          return;
        }

        // Delete old logo if exists
        if (configuration?.logo_url) {
          await deleteLogo(configuration.logo_url);
        }

        newLogoUrl = uploadedUrl;
      }

      // Update configuration
      await updateConfiguration({
        dentist_name: dentistName || "Dr. Boede",
        logo_url: newLogoUrl || undefined,
      });

      toast.success("Einstellungen erfolgreich gespeichert");
      setSelectedFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error("Error saving practice settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!configuration?.logo_url) return;

    try {
      setSaving(true);
      const deleted = await deleteLogo(configuration.logo_url);
      if (deleted) {
        await updateConfiguration({
          logo_url: null as any,
        });
        toast.success("Logo erfolgreich gelöscht");
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("Fehler beim Löschen des Logos");
    } finally {
      setSaving(false);
    }
  };

  const currentLogo = logoPreview || configuration?.logo_url || logoPlaceholder;
  const hasChanges =
    selectedFile !== null ||
    dentistName !== (configuration?.dentist_name || "Dr. Boede");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Praxis Logo</CardTitle>
          <CardDescription>
            Laden Sie Ihr Praxis-Logo hoch (PNG, JPG, JPEG oder SVG, max. 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={currentLogo}
                alt="Praxis Logo"
                className="h-24 w-24 object-contain border rounded-lg p-2 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? "Anderes Logo wählen" : "Logo hochladen"}
              </Button>
              {configuration?.logo_url && (
                <Button
                  variant="outline"
                  onClick={handleDeleteLogo}
                  disabled={uploading || saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Logo löschen
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Neue Datei ausgewählt: {selectedFile.name}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Praxis Name</CardTitle>
          <CardDescription>Name des Zahnarztes oder der Praxis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dentist-name">Name</Label>
            <Input
              id="dentist-name"
              value={dentistName}
              onChange={(e) => setDentistName(e.target.value)}
              placeholder="Dr. Boede"
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving || uploading}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            "Änderungen speichern"
          )}
        </Button>
      </div>
    </div>
  );
};
