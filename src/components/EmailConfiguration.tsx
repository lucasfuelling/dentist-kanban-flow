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
  const [emailTemplateFirst, setEmailTemplateFirst] = useState("");
  const [emailTemplateReminder, setEmailTemplateReminder] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configuration) {
      setWebhookUrl(configuration.webhook_url || "");
      setEmailTemplateFirst(configuration.email_template_first || "");
      setEmailTemplateReminder(configuration.email_template_reminder || "");
    }
  }, [configuration]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    setValue: (value: string) => void,
    currentValue: string
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = currentValue.substring(0, start) + "<br/>" + currentValue.substring(end);
      setValue(newValue);
      
      // Reposition cursor after the inserted <br/>
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 5;
      }, 0);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateConfiguration({
        webhook_url: webhookUrl || null,
        email_template_first: emailTemplateFirst || null,
        email_template_reminder: emailTemplateReminder || null,
      });

      toast({
        title: "Konfiguration gespeichert",
        description: "Email-Konfiguration wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Aktualisieren der Konfiguration.",
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
        <CardTitle>Email Vorlagen</CardTitle>
        <CardDescription>
          Konfiguriere die Webhook URL und zwei Email-Vorlagen: eine für die erste Email und eine für Erinnerungs-Emails.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email-template-first">Erste Email Vorlage</Label>
            <Textarea
              id="email-template-first"
              placeholder="Hallo {{firstName}} {{lastName}},&#10;&#10;Hier kommt die erste Email Vorlage. Zeilenumbruch mit<br/> &#10;&#10;Beste Grüße,&#10;Das Team"
              value={emailTemplateFirst}
              onChange={(e) => setEmailTemplateFirst(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, setEmailTemplateFirst, emailTemplateFirst)}
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              Erste Email, die von der &quot;Verschickt&quot;-Spalte gesendet wird.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-template-reminder">Erinnerungs Email Vorlage</Label>
            <Textarea
              id="email-template-reminder"
              placeholder="Hallo {{firstName}} {{lastName}},&#10;&#10;Hier kommt die Erinnerungs Email Vorlage. Zeilenumbruch mit<br/> &#10;&#10;Beste Grüße,&#10;Das Team"
              value={emailTemplateReminder}
              onChange={(e) => setEmailTemplateReminder(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, setEmailTemplateReminder, emailTemplateReminder)}
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              Erinnerung, die von der &quot;Erinnert&quot;-Spalte gesendet wird.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Benutze {`{{firstName}}`}, {`{{lastName}}`}, und {`{{email}}`} als Platzhalter für Patienten-Daten. Drücke Enter für Zeilenumbruch (&lt;br/&gt;) oder Shift+Enter für normale Zeilenumbrüche.
        </p>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </CardContent>
    </Card>
  );
};
