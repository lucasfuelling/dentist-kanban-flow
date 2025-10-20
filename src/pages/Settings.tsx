import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailConfiguration } from "@/components/EmailConfiguration";
import { UserManagement } from "@/components/UserManagement";
import { DsgvoManagement } from "@/components/DsgvoManagement";
import { PracticeSettings } from "@/components/PracticeSettings";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRoles } from "@/hooks/useRoles";

const Settings = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRoles();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">Einstellungen</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-1'}`}>
            {isAdmin && <TabsTrigger value="practice">Praxis</TabsTrigger>}
            <TabsTrigger value="email">Email Vorlage</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
            {isAdmin && <TabsTrigger value="dsgvo">DSGVO</TabsTrigger>}
          </TabsList>

          {isAdmin && (
            <TabsContent value="practice" className="space-y-6">
              <PracticeSettings />
            </TabsContent>
          )}

          <TabsContent value="email" className="space-y-6">
            <EmailConfiguration />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="dsgvo" className="space-y-6">
              <DsgvoManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
