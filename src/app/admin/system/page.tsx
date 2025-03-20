"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertCircle,
  Download,
  Upload,
  Database,
  HardDrive,
  Clock,
  RefreshCw,
  Trash2,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Info,
  Terminal,
  Archive,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Mock data for system logs
const systemLogs = [
  {
    id: 1,
    timestamp: "2023-11-22T14:35:26Z",
    level: "INFO",
    message: "User authentication successful",
    source: "auth-service",
    details: "User ID: 1245, IP: 103.86.45.12",
  },
  {
    id: 2,
    timestamp: "2023-11-22T14:32:10Z",
    level: "ERROR",
    message: "Payment gateway connection failed",
    source: "payment-service",
    details: "Connection timeout after 30s",
  },
  {
    id: 3,
    timestamp: "2023-11-22T14:30:45Z",
    level: "WARNING",
    message: "Rate limit exceeded",
    source: "api-gateway",
    details: "IP: 187.45.23.10, Endpoint: /api/tournaments",
  },
  {
    id: 4,
    timestamp: "2023-11-22T14:28:30Z",
    level: "INFO",
    message: "Tournament created successfully",
    source: "tournament-service",
    details: "Tournament ID: 567, Admin: user_admin_2",
  },
  {
    id: 5,
    timestamp: "2023-11-22T14:25:15Z",
    level: "ERROR",
    message: "Database query failed",
    source: "db-service",
    details: "Query timeout after 5s, Query ID: 789012",
  },
  {
    id: 6,
    timestamp: "2023-11-22T14:20:05Z",
    level: "INFO",
    message: "Scheduled task completed",
    source: "scheduler",
    details: "Task: daily-reports, Duration: 45s",
  },
  {
    id: 7,
    timestamp: "2023-11-22T14:15:30Z",
    level: "WARNING",
    message: "High memory usage detected",
    source: "monitoring",
    details: "Server: app-server-03, Memory: 85%",
  },
  {
    id: 8,
    timestamp: "2023-11-22T14:10:22Z",
    level: "INFO",
    message: "User registration completed",
    source: "user-service",
    details: "User ID: 1246, Method: email",
  },
];

// Mock data for backups
const backups = [
  {
    id: 1,
    name: "Full system backup",
    created: "2023-11-22T00:01:15Z",
    size: "4.2 GB",
    status: "COMPLETED",
    type: "AUTOMATED",
    location: "Amazon S3",
  },
  {
    id: 2,
    name: "Database backup",
    created: "2023-11-21T00:01:12Z",
    size: "2.8 GB",
    status: "COMPLETED",
    type: "AUTOMATED",
    location: "Amazon S3",
  },
  {
    id: 3,
    name: "Pre-update backup",
    created: "2023-11-20T15:45:30Z",
    size: "4.1 GB",
    status: "COMPLETED",
    type: "MANUAL",
    location: "Amazon S3",
  },
  {
    id: 4,
    name: "Database backup",
    created: "2023-11-20T00:01:18Z",
    size: "2.7 GB",
    status: "COMPLETED",
    type: "AUTOMATED",
    location: "Amazon S3",
  },
  {
    id: 5,
    name: "Full system backup",
    created: "2023-11-19T00:01:10Z",
    size: "4.2 GB",
    status: "COMPLETED",
    type: "AUTOMATED",
    location: "Amazon S3",
  },
];

export default function SystemAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logLevel, setLogLevel] = useState<string>("ALL");
  const [logSource, setLogSource] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentBackupOperation, setCurrentBackupOperation] = useState<string | null>(null);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(true);
  const [backupRetention, setBackupRetention] = useState<string>("30");
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is master admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/unauthorized");
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, session, router]);

  // If still checking authentication, show loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading system management...</p>
        </div>
      </div>
    );
  }

  const filteredLogs = systemLogs.filter((log) => {
    const matchesLevel = logLevel === "ALL" || log.level === logLevel;
    const matchesSource = logSource === "ALL" || log.source === logSource;
    const matchesSearch = 
      searchTerm === "" || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesLevel && matchesSource && matchesSearch;
  });

  const handleBackup = (type: string) => {
    setCurrentBackupOperation(type);
    setBackupProgress(0);
    
    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setCurrentBackupOperation(null);
            toast.success(`${type} backup completed successfully`);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleDatabaseOptimize = () => {
    toast.info("Database optimization started");
    setTimeout(() => {
      toast.success("Database optimization completed successfully");
    }, 3000);
  };

  const handleDatabaseRepair = () => {
    toast.info("Database repair started");
    setTimeout(() => {
      toast.success("Database repair completed successfully");
    }, 4000);
  };

  const handleClearCache = () => {
    toast.info("Clearing system cache");
    setTimeout(() => {
      toast.success("System cache cleared successfully");
    }, 2000);
  };

  const handleDownloadBackup = (backupId: number) => {
    toast.success(`Downloading backup #${backupId}`);
  };

  const handleDeleteBackup = (backupId: number) => {
    toast.success(`Backup #${backupId} deleted successfully`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">System Management</h1>
        <p className="text-muted-foreground">
          Manage system backups, logs, and database maintenance
        </p>
      </div>

      <Tabs defaultValue="backups" className="space-y-6">
        <TabsList className="grid grid-cols-3 gap-2">
          <TabsTrigger value="backups" className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            <span>Backups</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span>System Logs</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  System Backups
                </CardTitle>
                <CardDescription>
                  Create and manage system backups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    disabled={!!currentBackupOperation}
                    onClick={() => handleBackup("Full system")}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Full System Backup
                  </Button>
                  
                  <Button
                    disabled={!!currentBackupOperation}
                    onClick={() => handleBackup("Database")}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Database Backup
                  </Button>
                  
                  <Button
                    variant="outline"
                    disabled={!!currentBackupOperation}
                    onClick={() => handleBackup("Configuration")}
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    Config Backup
                  </Button>
                </div>

                {currentBackupOperation && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {currentBackupOperation} backup in progress...
                      </span>
                      <span className="text-sm">{backupProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" 
                        style={{ width: `${backupProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell className="font-medium">{backup.name}</TableCell>
                          <TableCell>{formatDate(backup.created)}</TableCell>
                          <TableCell>{backup.size}</TableCell>
                          <TableCell>
                            <Badge variant={backup.type === "AUTOMATED" ? "outline" : "default"}>
                              {backup.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                              {backup.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadBackup(backup.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteBackup(backup.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Backup Settings
                </CardTitle>
                <CardDescription>
                  Configure automated backup settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup" className="font-medium">
                      Automated Backups
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable daily system backups
                    </p>
                  </div>
                  <Switch 
                    id="auto-backup"
                    checked={autoBackupEnabled} 
                    onCheckedChange={setAutoBackupEnabled}
                  />
                </div>

                {autoBackupEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="backup-time">Backup Time</Label>
                      <select
                        id="backup-time"
                        className="w-full px-3 py-2 rounded-md border border-input bg-background h-10"
                      >
                        <option value="00:00">12:00 AM</option>
                        <option value="01:00">1:00 AM</option>
                        <option value="02:00">2:00 AM</option>
                        <option value="03:00">3:00 AM</option>
                        <option value="04:00">4:00 AM</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-retention">Retention Period (days)</Label>
                      <Input 
                        id="backup-retention"
                        type="number"
                        value={backupRetention}
                        onChange={(e) => setBackupRetention(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-location">Backup Location</Label>
                      <select
                        id="backup-location"
                        className="w-full px-3 py-2 rounded-md border border-input bg-background h-10"
                      >
                        <option value="s3">Amazon S3</option>
                        <option value="gcs">Google Cloud Storage</option>
                        <option value="azure">Azure Blob Storage</option>
                        <option value="local">Local Storage</option>
                      </select>
                    </div>
                  </>
                )}

                <Button className="w-full" disabled={!autoBackupEnabled}>
                  Save Backup Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>About Backups</AlertTitle>
            <AlertDescription>
              Regular backups are essential to protect your data. The system automatically performs daily backups, but you can also create manual backups at any time. Backups are stored securely and can be restored in case of data loss or corruption.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                System Logs
              </CardTitle>
              <CardDescription>
                Monitor system events and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search logs..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="px-3 py-2 rounded-md border border-input bg-background h-10"
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                >
                  <option value="ALL">All Levels</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                </select>

                <select
                  className="px-3 py-2 rounded-md border border-input bg-background h-10"
                  value={logSource}
                  onChange={(e) => setLogSource(e.target.value)}
                >
                  <option value="ALL">All Sources</option>
                  <option value="auth-service">Auth Service</option>
                  <option value="payment-service">Payment Service</option>
                  <option value="tournament-service">Tournament Service</option>
                  <option value="user-service">User Service</option>
                  <option value="db-service">Database Service</option>
                  <option value="api-gateway">API Gateway</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="scheduler">Scheduler</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            log.level === "ERROR" 
                              ? "bg-red-100 text-red-800 hover:bg-red-100" 
                              : log.level === "WARNING"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          }>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No logs found matching your criteria</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Download Logs
              </Button>
              <Button variant="secondary">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Database Maintenance
                </CardTitle>
                <CardDescription>
                  Perform database optimization and maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center mb-4">
                          <Database className="h-6 w-6 text-primary mr-3" />
                          <h3 className="font-medium">Database Optimization</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Optimize database performance by rebuilding indexes and reclaiming unused space.
                        </p>
                        <Button 
                          className="mt-auto"
                          onClick={handleDatabaseOptimize}
                        >
                          Optimize Database
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center mb-4">
                          <HardDrive className="h-6 w-6 text-primary mr-3" />
                          <h3 className="font-medium">System Cache</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Clear system caches to free up memory and improve performance.
                        </p>
                        <Button 
                          className="mt-auto"
                          onClick={handleClearCache}
                        >
                          Clear Cache
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-4">
                        <Terminal className="h-6 w-6 text-primary mr-3" />
                        <h3 className="font-medium">Database Repair</h3>
                      </div>
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                          Database repair should only be performed if you are experiencing database corruption issues. This process may take several minutes and could impact system performance.
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="destructive"
                        onClick={handleDatabaseRepair}
                      >
                        Repair Database
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current system health and resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Database Status</Label>
                      <span className="text-green-600 font-medium text-sm flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Healthy
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Database Size</Label>
                      <span className="text-sm font-medium">3.2 GB / 10 GB</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "32%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>File Storage</Label>
                      <span className="text-sm font-medium">14.8 GB / 50 GB</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "29.6%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Server CPU</Label>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "42%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Server Memory</Label>
                      <span className="text-yellow-600 font-medium text-sm flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        High (78%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Last Maintenance</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span>Database Optimization:</span>
                    <span className="font-medium">2 days ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Cache Cleared:</span>
                    <span className="font-medium">1 day ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Database Repair:</span>
                    <span className="font-medium">30 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 