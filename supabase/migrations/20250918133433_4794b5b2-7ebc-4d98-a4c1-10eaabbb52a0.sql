-- Fix the Kanban enum to include all status values
ALTER TYPE "Kanban" ADD VALUE IF NOT EXISTS 'terminated';
ALTER TYPE "Kanban" ADD VALUE IF NOT EXISTS 'no_response';