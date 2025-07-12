"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  MapPin,
  Settings,
} from "lucide-react";

interface MetricWidgetProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricWidget({
  title,
  value,
  description,
  trend,
  icon,
  className = "",
}: MetricWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-xs ml-1 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline";
}

export function QuickActionWidget({
  title,
  description,
  icon,
  onClick,
  variant = "default",
}: QuickActionProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 text-primary">{icon}</div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "booking" | "payment" | "member" | "space" | "system";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
}

export function ActivityFeedWidget({
  activities,
  title = "Recent Activity",
  maxItems = 5,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "member":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "space":
        return <Building className="h-4 w-4 text-orange-600" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartWidgetProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartWidget({
  title,
  description,
  children,
  className = "",
}: ChartWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface StatusIndicatorProps {
  status: "online" | "offline" | "maintenance" | "warning";
  label: string;
  description?: string;
}

export function StatusIndicatorWidget({
  status,
  label,
  description,
}: StatusIndicatorProps) {
  const getStatusColor = (status: StatusIndicatorProps["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "maintenance":
        return "bg-yellow-500";
      case "warning":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

// Pre-configured metric widgets for common use cases
export const CommonMetrics = {
  TotalUsers: (props: Omit<MetricWidgetProps, "icon">) => (
    <MetricWidget {...props} icon={<Users className="h-4 w-4" />} />
  ),
  TotalSpaces: (props: Omit<MetricWidgetProps, "icon">) => (
    <MetricWidget {...props} icon={<Building className="h-4 w-4" />} />
  ),
  TotalBookings: (props: Omit<MetricWidgetProps, "icon">) => (
    <MetricWidget {...props} icon={<Calendar className="h-4 w-4" />} />
  ),
  Revenue: (props: Omit<MetricWidgetProps, "icon">) => (
    <MetricWidget {...props} icon={<DollarSign className="h-4 w-4" />} />
  ),
  Occupancy: (props: Omit<MetricWidgetProps, "icon">) => (
    <MetricWidget {...props} icon={<MapPin className="h-4 w-4" />} />
  ),
  ActiveSessions: (props: Omit<MetricWidgetProps, "icon">) => (
    <MetricWidget {...props} icon={<Clock className="h-4 w-4" />} />
  ),
};
