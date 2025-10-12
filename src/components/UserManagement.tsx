import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const userSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail darf maximal 255 Zeichen lang sein"),
  password: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .max(128, "Passwort darf maximal 128 Zeichen lang sein")
    .regex(/[A-Z]/, "Passwort muss mindestens einen Großbuchstaben enthalten")
    .regex(/[a-z]/, "Passwort muss mindestens einen Kleinbuchstaben enthalten")
    .regex(/[0-9]/, "Passwort muss mindestens eine Zahl enthalten"),
  role: z.enum(["user", "admin"]),
});

export const UserManagement = () => {
  const { users, loading, createUser } = useUserManagement();
  const { toast } = useToast();

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async () => {
    // Validate inputs
    try {
      const validated = userSchema.parse({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setCreating(true);
      const { user, error } = await createUser(
        validated.email,
        validated.password,
        validated.role
      );

      if (error) {
        throw error;
      }

      if (user) {
        toast({
          title: "Benutzer erstellt",
          description: `Benutzer wurde erfolgreich erstellt.`,
        });

        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validierungsfehler",
          description: error.errors[0].message,
        });
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Fehler beim Erstellen",
        description: error.message || "Beim Erstellen des Benutzers ist ein Fehler aufgetreten.",
      });
    } finally {
      setCreating(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Neuen Benutzer anlegen
          </CardTitle>
          <CardDescription>Lege einen neuen Benutzer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-password">Passwort</Label>
              <Input
                id="new-user-password"
                type="password"
                placeholder="Enter password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-user-role">Rolle</Label>
            <Select value={newUserRole} onValueChange={setNewUserRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreateUser}
            disabled={creating || !newUserEmail || !newUserPassword}
            className="w-full"
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Benutzer erstellen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzer Management
          </CardTitle>
          <CardDescription>Admin und User Rollen verwalten.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found. Create a user to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {user.roles?.map((role) => (
                      <Badge
                        key={role}
                        variant={role === "admin" ? "default" : "secondary"}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
