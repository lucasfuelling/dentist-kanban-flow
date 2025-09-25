import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const EmailConfiguration = () => {
  const { configuration, loading, updateConfiguration } = useConfiguration();
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configuration) {
      setWebhookUrl(configuration.webhook_url || "");
      setEmailTemplate(configuration.email_template || "");
    }
  }, [configuration]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateConfiguration({
        webhook_url: webhookUrl || null,
        email_template: emailTemplate || null,
      });

      toast({
        title: "Configuration saved",
        description: "Email configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving configuration",
        description: "There was a problem updating the configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Vorlage</CardTitle>
        <CardDescription>
          Bitte konfiguriere die Webhook URL und die Email Vorlage f&uuml;r
          Patienten-Benachrichtigungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-webhook-endpoint.com/send-email"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-template">Email Vorlage</Label>
          <Textarea
            id="email-template"
            placeholder="Hallo {{firstName}} {{lastName}},&#10;&#10;Hier kommt die Vorlage. Zeilenumbruch mit<br/> &#10;&#10;Best regards,&#10;The Team"
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            rows={8}
          />
          <p className="text-sm text-muted-foreground">
            Benutze {`{{firstName}}`}, {`{{lastName}}`}, und {`{{email}}`} als
            Platzhalter f&uuml;r Patienten-Daten.&#10;Zeilenumbruch mit
            &#34;&lt;br/&gt;&#34;.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </CardContent>
    </Card>
  );
};
