import { Droppable } from "@hello-pangea/dnd";
import { LucideIcon } from "lucide-react";

interface ArchiveBoxProps {
  id: string;
  title: string;
  count: number;
  icon: LucideIcon;
  variant: 'success' | 'error';
}

export function ArchiveBox({ id, title, count, icon: Icon, variant }: ArchiveBoxProps) {
  const bgColor = variant === 'success' ? 'bg-archive-success-bg' : 'bg-archive-error-bg';
  const textColor = variant === 'success' ? 'text-archive-success' : 'text-archive-error';
  const borderColor = variant === 'success' ? 'border-archive-success/20' : 'border-archive-error/20';

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            ${bgColor}
            ${textColor}
            border-2 border-dashed ${borderColor}
            rounded-lg p-4 text-center transition-all duration-200
            ${snapshot.isDraggingOver ? 'scale-105 border-solid shadow-lg' : ''}
          `}
        >
          <div className="flex flex-col items-center space-y-2">
            <Icon className="h-6 w-6" />
            <h3 className="font-semibold text-sm">{title}</h3>
            <div className="text-2xl font-bold">{count}</div>
            <p className="text-xs opacity-75">
              Hier hinziehen zum Archivieren
            </p>
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}