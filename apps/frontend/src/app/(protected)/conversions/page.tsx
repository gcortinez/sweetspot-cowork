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
  ArrowRightLeft,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Calendar,
} from "lucide-react";

interface Conversion {
  id: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    source: string;
    score: number;
  };
  client: {
    name: string;
    email: string;
    status: string;
  };
  opportunity?: {
    title: string;
    value: number;
    stage: string;
    probability: number;
  };
  convertedBy: {
    firstName: string;
    lastName: string;
  };
  conversionNotes?: string;
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'WEBSITE': return 'bg-blue-100 text-blue-800';
    case 'REFERRAL': return 'bg-green-100 text-green-800';
    case 'SOCIAL_MEDIA': return 'bg-purple-100 text-purple-800';
    case 'EMAIL_CAMPAIGN': return 'bg-orange-100 text-orange-800';
    case 'PHONE': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockConversions: Conversion[] = [
      {
        id: "1",
        lead: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          source: "WEBSITE",
          score: 85
        },
        client: {
          name: "John Doe Consulting",
          email: "john.doe@example.com",
          status: "ACTIVE"
        },
        opportunity: {
          title: "Tech Corp Office Space",
          value: 50000,
          stage: "NEGOTIATION",
          probability: 75
        },
        convertedBy: {
          firstName: "Jane",
          lastName: "Smith"
        },
        conversionNotes: "High-value lead with immediate need for office space",
        createdAt: "2024-01-15T10:30:00Z"
      },
      {
        id: "2",
        lead: {
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.j@example.com",
          source: "REFERRAL",
          score: 72
        },
        client: {
          name: "Design Studio LLC",
          email: "sarah.j@example.com",
          status: "ACTIVE"
        },
        convertedBy: {
          firstName: "Mike",
          lastName: "Wilson"
        },
        conversionNotes: "Referred by existing client, quick conversion process",
        createdAt: "2024-01-14T14:15:00Z"
      }
    ];

    setTimeout(() => {
      setConversions(mockConversions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredConversions = conversions.filter(conversion => {
    const matchesSearch = `${conversion.lead.firstName} ${conversion.lead.lastName} ${conversion.client.name} ${conversion.opportunity?.title || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: conversions.length,
    thisMonth: conversions.filter(c => {
      const conversionDate = new Date(c.createdAt);
      const now = new Date();
      return conversionDate.getMonth() === now.getMonth() && 
             conversionDate.getFullYear() === now.getFullYear();
    }).length,
    withOpportunity: conversions.filter(c => c.opportunity).length,
    totalValue: conversions.reduce((sum, c) => sum + (c.opportunity?.value || 0), 0),
  };

  const conversionRate = 65; // Mock conversion rate - would be calculated from total leads

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
          <ArrowRightLeft className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Conversions</h1>
            <p className="text-gray-600">Track successful lead to client conversions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.thisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Opportunities</p>
                <p className="text-2xl font-bold text-orange-600">{stats.withOpportunity}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
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
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Total Leads</span>
                </div>
                <span className="text-lg font-bold text-blue-600">150</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Qualified Leads</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">98 (65%)</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Converted to Clients</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.total} ({conversionRate}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Converting Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-800">REFERRAL</Badge>
                  <span className="text-sm">Referrals</span>
                </div>
                <span className="font-semibold">85%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800">WEBSITE</Badge>
                  <span className="text-sm">Website</span>
                </div>
                <span className="font-semibold">72%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-orange-100 text-orange-800">EMAIL_CAMPAIGN</Badge>
                  <span className="text-sm">Email Campaigns</span>
                </div>
                <span className="font-semibold">58%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-800">SOCIAL_MEDIA</Badge>
                  <span className="text-sm">Social Media</span>
                </div>
                <span className="font-semibold">45%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Recent Conversions</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Period
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedPeriod("all")}>
                    All Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod("30d")}>
                    Last 30 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod("7d")}>
                    Last 7 Days
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
                <TableHead>Original Lead</TableHead>
                <TableHead>Client Created</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Lead Score</TableHead>
                <TableHead>Opportunity</TableHead>
                <TableHead>Converted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversions.map((conversion) => (
                <TableRow key={conversion.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {conversion.lead.firstName} {conversion.lead.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{conversion.lead.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{conversion.client.name}</div>
                      <div className="text-sm text-gray-500">{conversion.client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSourceColor(conversion.lead.source)}>
                      {conversion.lead.source.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-600">
                        {conversion.lead.score}
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 transition-all duration-300"
                          style={{ width: `${conversion.lead.score}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {conversion.opportunity ? (
                      <div>
                        <div className="font-medium text-sm">{conversion.opportunity.title}</div>
                        <div className="text-sm text-green-600 font-semibold">
                          {formatCurrency(conversion.opportunity.value)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No opportunity</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {conversion.convertedBy.firstName} {conversion.convertedBy.lastName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(conversion.createdAt).toLocaleDateString()}
                    </span>
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
                        <DropdownMenuItem>View Client</DropdownMenuItem>
                        {conversion.opportunity && (
                          <DropdownMenuItem>View Opportunity</DropdownMenuItem>
                        )}
                        <DropdownMenuItem>Export Report</DropdownMenuItem>
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