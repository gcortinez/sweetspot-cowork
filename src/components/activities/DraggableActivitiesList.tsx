"use client";

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  User, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  Activity,
  GripVertical,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateActivityOrder, deleteActivity } from "@/lib/actions/activities";

interface ActivityData {
  id: string;
  type: string;
  title: string;
  description?: string;
  sortOrder?: number;
  completedAt?: Date | null;
  dueDate?: Date;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface SortableActivityItemProps {
  activity: ActivityData;
  onDelete: (activityId: string) => void;
  onToggleComplete: (activityId: string, completed: boolean) => void;
  onClick: (activity: ActivityData) => void;
}

function SortableActivityItem({ activity, onDelete, onToggleComplete, onClick }: SortableActivityItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'MEETING': return <MessageSquare className="h-4 w-4" />;
      case 'NOTE': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const isCompleted = Boolean(activity.completedAt);
  const isOverdue = activity.dueDate && new Date(activity.dueDate) < new Date() && !isCompleted;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(activity.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(activity.id, !isCompleted);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
        isCompleted ? 'opacity-75' : ''
      } ${isOverdue ? 'border-l-4 border-red-500' : ''}`}
      onClick={() => onClick(activity)}
    >
      {/* Drag Handle */}
      <div 
        className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Activity Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
          {activity.title}
        </p>
        {activity.description && (
          <p className={`text-gray-600 text-sm mt-1 ${isCompleted ? 'line-through' : ''}`}>
            {activity.description}
          </p>
        )}
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <User className="h-3 w-3 mr-1" />
          {activity.user.firstName} {activity.user.lastName}
          <span className="mx-2">•</span>
          <Clock className="h-3 w-3 mr-1" />
          {new Date(activity.createdAt).toLocaleDateString()}
          {activity.dueDate && (
            <>
              <span className="mx-2">•</span>
              <span className={`${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                Vence: {new Date(activity.dueDate).toLocaleDateString()}
              </span>
            </>
          )}
          {isCompleted && (
            <>
              <span className="mx-2">•</span>
              <span className="text-green-600 font-medium">Completada</span>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        {/* Complete/Uncomplete Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${isCompleted ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-green-600'}`}
          onClick={handleToggleComplete}
          title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          <Check className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
            onClick={handleDeleteClick}
            title="Eliminar actividad"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={handleConfirmDelete}
              title="Confirmar eliminación"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={handleCancelDelete}
              title="Cancelar"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface DraggableActivitiesListProps {
  activities: ActivityData[];
  onActivitiesReorder: (newActivities: ActivityData[]) => void;
  onActivityDelete: (activityId: string) => void;
  onActivityToggleComplete: (activityId: string, completed: boolean) => void;
  onActivityClick: (activity: ActivityData) => void;
}

export default function DraggableActivitiesList({
  activities,
  onActivitiesReorder,
  onActivityDelete,
  onActivityToggleComplete,
  onActivityClick,
}: DraggableActivitiesListProps) {
  const [localActivities, setLocalActivities] = useState(activities);
  const { toast } = useToast();

  // Update local state when props change
  React.useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localActivities.findIndex((item) => item.id === active.id);
    const newIndex = localActivities.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newActivities = arrayMove(localActivities, oldIndex, newIndex);
    
    // Update local state immediately for better UX
    setLocalActivities(newActivities);

    try {
      // Create the reorder data with new sort orders
      const reorderData = newActivities.map((activity, index) => ({
        id: activity.id,
        sortOrder: index,
      }));

      const result = await updateActivityOrder(reorderData);

      if (result.success) {
        // Update parent component
        onActivitiesReorder(newActivities);
        toast({
          title: "Orden actualizado",
          description: "El orden de las actividades ha sido actualizado.",
        });
      } else {
        // Revert local state if server update failed
        setLocalActivities(activities);
        toast({
          title: "Error al reordenar",
          description: result.error || "No se pudo actualizar el orden de las actividades.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert local state if error occurred
      setLocalActivities(activities);
      toast({
        title: "Error al reordenar",
        description: "Ocurrió un error inesperado al reordenar las actividades.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (activityId: string) => {
    try {
      const result = await deleteActivity(activityId);

      if (result.success) {
        onActivityDelete(activityId);
        toast({
          title: "Actividad eliminada",
          description: "La actividad ha sido eliminada exitosamente.",
        });
      } else {
        toast({
          title: "Error al eliminar",
          description: result.error || "No se pudo eliminar la actividad.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "Ocurrió un error inesperado al eliminar la actividad.",
        variant: "destructive",
      });
    }
  };

  if (localActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay actividades registradas para esta oportunidad.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localActivities.map(activity => activity.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {localActivities.map((activity) => (
            <SortableActivityItem
              key={activity.id}
              activity={activity}
              onDelete={handleDelete}
              onToggleComplete={onActivityToggleComplete}
              onClick={onActivityClick}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}