-- Update the Kanban enum to include terminated and no_response statuses
ALTER TYPE "Kanban" ADD VALUE 'terminated';
ALTER TYPE "Kanban" ADD VALUE 'no_response';