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
  Target,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  value: number;
  probability: number;
  expectedRevenue: number;
  stage: 'INITIAL_CONTACT' | 'NEEDS_ANALYSIS' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  expectedCloseDate?: string;
  client: {
    name: string;
    email: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'INITIAL_CONTACT': return 'bg-blue-100 text-blue-800';
    case 'NEEDS_ANALYSIS': return 'bg-yellow-100 text-yellow-800';
    case 'PROPOSAL_SENT': return 'bg-orange-100 text-orange-800';
    case 'NEGOTIATION': return 'bg-purple-100 text-purple-800';
    case 'CLOSED_WON': return 'bg-green-100 text-green-800';
    case 'CLOSED_LOST': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const { toast } = useToast();

  const handleCreateOpportunity = () => {
    toast({
      title: "Funcionalidad próximamente disponible",
      description: "La creación de oportunidades estará disponible en una próxima actualización",
    });
  };

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockOpportunities: Opportunity[] = [
      {
        id: "1",
        title: "Tech Corp Office Space",
        description: "Large office space for tech startup",
        value: 50000,
        probability: 75,
        expectedRevenue: 37500,
        stage: "NEGOTIATION",
        expectedCloseDate: "2024-02-15",
        client: { name: "Tech Corp", email: "contact@techcorp.com" },
        assignedTo: { firstName: "Jane", lastName: "Smith" },
        createdAt: "2024-01-10T10:30:00Z"
      },
      {
        id: "2",
        title: "Design Studio Workspace",
        description: "Creative workspace for design team",
        value: 25000,
        probability: 60,
        expectedRevenue: 15000,
        stage: "PROPOSAL_SENT",
        expectedCloseDate: "2024-02-28",
        client: { name: "Design Studio", email: "hello@designstudio.com" },
        assignedTo: { firstName: "Mike", lastName: "Wilson" },
        createdAt: "2024-01-12T14:15:00Z"
      }
    ];

    setTimeout(() => {
      setOpportunities(mockOpportunities);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = `${opp.title} ${opp.client.name} ${opp.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === "all" || opp.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const stats = {
    total: opportunities.length,
    totalValue: opportunities.reduce((sum, opp) => sum + opp.value, 0),
    expectedRevenue: opportunities.reduce((sum, opp) => sum + opp.expectedRevenue, 0),
    averageProbability: opportunities.length > 0 
      ? opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length 
      : 0,
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
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
            <p className="text-gray-600">Track your sales pipeline</p>
          </div>
        </div>
        <Button 
          className="gap-2"
          onClick={handleCreateOpportunity}
        >
          <Plus className="h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.expectedRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Probability</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.averageProbability)}%
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Pipeline Overview</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Stage
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedStage("all")}>
                    All Stages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStage("INITIAL_CONTACT")}>
                    Initial Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStage("NEEDS_ANALYSIS")}>
                    Needs Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStage("PROPOSAL_SENT")}>
                    Proposal Sent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStage("NEGOTIATION")}>
                    Negotiation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStage("CLOSED_WON")}>
                    Closed Won
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
                <TableHead>Opportunity</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Expected Revenue</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{opportunity.title}</div>
                      {opportunity.description && (
                        <div className="text-sm text-gray-500 truncate max-w-48">
                          {opportunity.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{opportunity.client.name}</div>
                      <div className="text-sm text-gray-500">{opportunity.client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(opportunity.value)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{opportunity.probability}%</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${opportunity.probability}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(opportunity.expectedRevenue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStageColor(opportunity.stage)}>
                      {opportunity.stage.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {opportunity.expectedCloseDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {opportunity.assignedTo ? (
                      <span className="text-sm">
                        {opportunity.assignedTo.firstName} {opportunity.assignedTo.lastName}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
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
                        <DropdownMenuItem>Edit Opportunity</DropdownMenuItem>
                        <DropdownMenuItem>Update Stage</DropdownMenuItem>
                        <DropdownMenuItem>Add Activity</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete Opportunity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}