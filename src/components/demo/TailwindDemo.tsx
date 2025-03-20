"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { 
  AlertCircle, 
  Check, 
  Info, 
  Star, 
  Sparkles, 
  Award, 
  Trophy,
  CheckCircle,
  BookOpen
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function TailwindDemo() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Tailwind v3 Component Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default Button</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="blue">Blue</Button>
              <Button variant="teal">Teal</Button>
              <Button variant="gradient">Gradient</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Star className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>This is a default card with basic styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Cards are a great way to display content in a clean and organized manner.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>
          
          <Card variant="destructive">
            <CardHeader>
              <CardTitle>Destructive Card</CardTitle>
              <CardDescription>For important warnings or critical information</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card style can be used to highlight critical information or warnings.</p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive">Delete</Button>
            </CardFooter>
          </Card>
          
          <Card variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-blue-400" />
                Premium Card
              </CardTitle>
              <CardDescription>With gradient background and special styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This premium card style can be used for featured content or special offers.</p>
            </CardContent>
            <CardFooter>
              <Button variant="gradient">Upgrade Now</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
          <div className="space-y-4">
            <Input placeholder="Default input" />
            <Input placeholder="Outline variant" variant="outline" />
            <Input placeholder="Ghost variant" variant="ghost" />
            <Input placeholder="Premium variant" variant="premium" />
            <Input placeholder="Error state" state="error" />
            <Input placeholder="Success state" state="success" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tooltips</h2>
          <div className="flex flex-wrap gap-4 p-8 justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Default tooltip
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="destructive">
                  Destructive tooltip
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Check className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="success">
                  Success tooltip
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trophy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="info">
                  Info tooltip
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with basic styling.
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Destructive Alert</AlertTitle>
            <AlertDescription>
              This alert style is used for errors or critical warnings.
            </AlertDescription>
          </Alert>
          
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success Alert</AlertTitle>
            <AlertDescription>
              This alert confirms that an action was completed successfully.
            </AlertDescription>
          </Alert>
          
          <Alert variant="info">
            <BookOpen className="h-4 w-4" />
            <AlertTitle>Information Alert</AlertTitle>
            <AlertDescription>
              This alert provides helpful information or guidance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
      
      <div className="border-t border-border pt-6 mt-10">
        <p className="text-center text-muted-foreground">
          All components are now compatible with Tailwind CSS v3 with dark mode support and beautiful styling.
        </p>
      </div>
    </div>
  );
} 