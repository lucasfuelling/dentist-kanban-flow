import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const LogoutButton = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Auf Wiedersehen!',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Abmelden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Abmelden
    </Button>
  );
};