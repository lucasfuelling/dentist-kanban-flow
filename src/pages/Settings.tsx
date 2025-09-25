import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailConfiguration } from "@/components/EmailConfiguration";
import { UserManagement } from "@/components/UserManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Vorlage</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-6">
            <EmailConfiguration />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
