"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";

type DatabaseStatusData = {
  status: {
    isConnected: boolean;
    isUsingFallback: boolean;
    connectionErrors: number;
    lastError: string;
    mainUrl: string | null;
    fallbackEnabled: boolean;
  };
  testQuery: {
    success: boolean;
    responseTime: string;
    error: string | null;
  };
  environment: {
    nodeEnv: string;
    databaseUrl: string | null;
    fallbackEnabled: boolean;
  };
  timestamp: string;
};

export default function DatabaseStatus() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/diagnostics/database');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch database status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDbStatus(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching database status');
      console.error('Database status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dbStatus) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Database Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={fetchDatabaseStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!dbStatus) return null;
  
  const { status, testQuery, environment } = dbStatus;
  const isHealthy = status.isConnected && testQuery.success;

  return (
    <Card className={isHealthy ? '' : 'border-amber-200 bg-amber-50'}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Database Status
          </CardTitle>
          
          <Badge variant={isHealthy ? "success" : "destructive"}>
            {isHealthy ? 'Healthy' : 'Issues Detected'}
          </Badge>
        </div>
        <CardDescription>
          Last checked: {new Date(dbStatus.timestamp).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Connection:</div>
          <div className={status.isConnected ? 'text-emerald-600' : 'text-red-600'}>
            {status.isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <div className="font-medium">Using Fallback:</div>
          <div>
            {status.isUsingFallback ? (
              <span className="text-amber-600">Yes</span>
            ) : (
              <span>No</span>
            )}
          </div>
          
          <div className="font-medium">Test Query:</div>
          <div className={testQuery.success ? 'text-emerald-600' : 'text-red-600'}>
            {testQuery.success ? 'Success' : 'Failed'}
            {testQuery.success && <span className="text-slate-500 ml-1">({testQuery.responseTime})</span>}
          </div>
          
          <div className="font-medium">Connection Errors:</div>
          <div className={status.connectionErrors > 0 ? 'text-red-600' : 'text-slate-600'}>
            {status.connectionErrors}
          </div>
          
          <div className="font-medium">Environment:</div>
          <div className="uppercase">
            <Badge variant="secondary" className="font-mono text-xs">
              {environment.nodeEnv}
            </Badge>
          </div>
        </div>
        
        {status.lastError && (
          <div className="text-sm bg-red-50 p-2 border border-red-100 rounded-md">
            <div className="font-medium text-red-700">Last Error:</div>
            <div className="text-red-600 font-mono text-xs mt-1 whitespace-pre-wrap break-all">
              {status.lastError}
            </div>
          </div>
        )}
        
        {testQuery.error && !status.lastError && (
          <div className="text-sm bg-red-50 p-2 border border-red-100 rounded-md">
            <div className="font-medium text-red-700">Query Error:</div>
            <div className="text-red-600 font-mono text-xs mt-1 whitespace-pre-wrap">
              {testQuery.error}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        <Button onClick={fetchDatabaseStatus} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
} 