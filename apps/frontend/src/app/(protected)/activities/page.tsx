"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  Users,
  FileText,
  Target,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'TOUR' | 'FOLLOW_UP' | 'DOCUMENT';
  subject: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  entityType?: 'LEAD' | 'CLIENT' | 'OPPORTUNITY';
  entityName?: string;
  assignedTo: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'CALL': return Phone;
    case 'EMAIL': return Mail;
    case 'MEETING': return Users;
    case 'TASK': return CheckCircle;
    case 'NOTE': return FileText;
    case 'TOUR': return Users;
    case 'FOLLOW_UP': return Clock;
    case 'DOCUMENT': return FileText;
    default: return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'CALL': return 'bg-blue-100 text-blue-800';
    case 'EMAIL': return 'bg-purple-100 text-purple-800';
    case 'MEETING': return 'bg-green-100 text-green-800';
    case 'TASK': return 'bg-orange-100 text-orange-800';
    case 'NOTE': return 'bg-gray-100 text-gray-800';
    case 'TOUR': return 'bg-yellow-100 text-yellow-800';
    case 'FOLLOW_UP': return 'bg-red-100 text-red-800';
    case 'DOCUMENT': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'bg-red-100 text-red-800';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
    case 'LOW': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        type: "CALL",
        subject: "Follow-up call with Tech Corp",
        description: "Discuss pricing and contract terms",
        status: "COMPLETED",
        priority: "HIGH",
        scheduledAt: "2024-01-15T14:00:00Z",
        completedAt: "2024-01-15T14:30:00Z",
        duration: 30,
        entityType: "OPPORTUNITY",
        entityName: "Tech Corp Office Space",
        assignedTo: { firstName: "Jane", lastName: "Smith" },
        createdAt: "2024-01-15T10:00:00Z"
      },
      {
        id: "2",
        type: "EMAIL",
        subject: "Send proposal to Design Studio",
        description: "Send updated proposal with new pricing",
        status: "PENDING",
        priority: "MEDIUM",
        scheduledAt: "2024-01-16T09:00:00Z",
        entityType: "LEAD",
        entityName: "Sarah Johnson",
        assignedTo: { firstName: "Mike", lastName: "Wilson" },
        createdAt: "2024-01-15T16:00:00Z"
      },
      {
        id: "3",
        type: "MEETING",
        subject: "Site tour with potential client",
        description: "Show workspace options and amenities",
        status: "PENDING",
        priority: "HIGH",
        scheduledAt: "2024-01-17T11:00:00Z",
        duration: 60,
        entityType: "LEAD",
        entityName: "John Doe",
        assignedTo: { firstName: "Jane", lastName: "Smith" },
        createdAt: "2024-01-15T17:00:00Z"
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = `${activity.subject} ${activity.description || ''} ${activity.entityName || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || activity.type === selectedType;
    const matchesStatus = selectedStatus === "all" || activity.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: activities.length,
    completed: activities.filter(a => a.status === 'COMPLETED').length,
    pending: activities.filter(a => a.status === 'PENDING').length,
    overdue: activities.filter(a => 
      a.status === 'PENDING' && 
      a.scheduledAt && 
      new Date(a.scheduledAt) < new Date()
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
            <p className="text-gray-600">Track all customer interactions</p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Activity Timeline</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedType("all")}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("CALL")}>
                    Calls
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("EMAIL")}>
                    Emails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("MEETING")}>
                    Meetings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("TASK")}>
                    Tasks
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("PENDING")}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("COMPLETED")}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("CANCELLED")}>
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Related To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const isOverdue = activity.status === 'PENDING' && 
                  activity.scheduledAt && 
                  new Date(activity.scheduledAt) < new Date();

                return (
                  <TableRow key={activity.id} className={isOverdue ? "bg-red-50" : ""}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{activity.subject}</div>
                          {activity.description && (
                            <div className="text-sm text-gray-500 truncate max-w-64">
                              {activity.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActivityColor(activity.type)}>
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {activity.entityName ? (
                        <div className="flex items-center gap-2">
                          {activity.entityType === 'OPPORTUNITY' && <Target className="h-4 w-4 text-purple-500" />}
                          {activity.entityType === 'LEAD' && <Users className="h-4 w-4 text-blue-500" />}
                          {activity.entityType === 'CLIENT' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          <div>
                            <div className="font-medium text-sm">{activity.entityName}</div>
                            <div className="text-xs text-gray-500">{activity.entityType}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {activity.scheduledAt ? (
                        <div className="text-sm">
                          <div className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {new Date(activity.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.scheduledAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {activity.assignedTo.firstName} {activity.assignedTo.lastName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {activity.duration ? (
                        <span className="text-sm">{activity.duration}m</span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Activity</DropdownMenuItem>
                          {activity.status === 'PENDING' && (
                            <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete Activity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}