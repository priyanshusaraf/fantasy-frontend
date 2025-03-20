"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertCircle,
  Settings,
  CreditCard,
  Bell,
  ShieldAlert,
  Save,
  Lock,
  Send,
  Globe,
  Percent,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Check if user is master admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // Platform settings state
  const [platformName, setPlatformName] = useState("Final Fantasy");
  const [platformDescription, setPlatformDescription] = useState("The ultimate fantasy sports platform for tournaments and contests.");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("We're currently performing scheduled maintenance. Please check back later.");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");

  // Payment settings state
  const [gatewayProvider, setGatewayProvider] = useState("Razorpay");
  const [gatewayApiKey, setGatewayApiKey] = useState("rzp_test_1234567890");
  const [gatewaySecretKey, setGatewaySecretKey] = useState("••••••••••••••••••••••");
  const [minimumDeposit, setMinimumDeposit] = useState("100");
  const [maximumDeposit, setMaximumDeposit] = useState("50000");
  const [platformFeePercentage, setPlatformFeePercentage] = useState("10");
  const [enableCryptoPayments, setEnableCryptoPayments] = useState(false);

  // Notification settings state
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);
  const [adminEmail, setAdminEmail] = useState("admin@finalfantasy.com");
  const [supportEmail, setSupportEmail] = useState("support@finalfantasy.com");
  const [emailFromName, setEmailFromName] = useState("Final Fantasy");
  const [enableUserRegistrationEmails, setEnableUserRegistrationEmails] = useState(true);
  const [enableTournamentNotifications, setEnableTournamentNotifications] = useState(true);
  const [enablePaymentNotifications, setEnablePaymentNotifications] = useState(true);

  // Security settings state
  const [enforceStrongPasswords, setEnforceStrongPasswords] = useState(true);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [enableReCaptcha, setEnableReCaptcha] = useState(true);
  const [reCaptchaSiteKey, setReCaptchaSiteKey] = useState("6LdxxxxxxxxxxxxxxxABCDEF");
  const [reCaptchaSecretKey, setReCaptchaSecretKey] = useState("••••••••••••••••••••••");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");

  // If still checking authentication, show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const handleSavePlatformSettings = () => {
    // In a real application, you would save these settings to your backend
    toast.success("Platform settings saved successfully");
  };

  const handleSavePaymentSettings = () => {
    toast.success("Payment settings saved successfully");
  };

  const handleSaveNotificationSettings = () => {
    toast.success("Notification settings saved successfully");
  };

  const handleSaveSecuritySettings = () => {
    toast.success("Security settings saved successfully");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure global settings for the Final Fantasy platform
        </p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-2">
          <TabsTrigger value="platform" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Platform</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                Configure the basic settings for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input 
                    id="platform-name" 
                    value={platformName} 
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-language">Default Language</Label>
                  <select
                    id="default-language"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background h-10"
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                    <option value="te">Telugu</option>
                    <option value="ta">Tamil</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-description">Platform Description</Label>
                <Textarea 
                  id="platform-description" 
                  rows={3}
                  value={platformDescription} 
                  onChange={(e) => setPlatformDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default-currency">Default Currency</Label>
                  <select
                    id="default-currency"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background h-10"
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to prevent users from accessing the platform
                    </p>
                  </div>
                  <Switch 
                    checked={isMaintenanceMode} 
                    onCheckedChange={setIsMaintenanceMode}
                  />
                </div>

                {isMaintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea 
                      id="maintenance-message" 
                      rows={2}
                      value={maintenanceMessage} 
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSavePlatformSettings} 
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Platform Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment gateways and transaction settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gateway-provider">Payment Gateway</Label>
                  <select
                    id="gateway-provider"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background h-10"
                    value={gatewayProvider}
                    onChange={(e) => setGatewayProvider(e.target.value)}
                  >
                    <option value="Razorpay">Razorpay</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gateway-api-key">API Key</Label>
                  <Input 
                    id="gateway-api-key" 
                    value={gatewayApiKey} 
                    onChange={(e) => setGatewayApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateway-secret-key">Secret Key</Label>
                <Input 
                  id="gateway-secret-key" 
                  type="password"
                  value={gatewaySecretKey} 
                  onChange={(e) => setGatewaySecretKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This key is used to authenticate requests with your payment provider. Keep it secure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="min-deposit">Minimum Deposit (₹)</Label>
                  <Input 
                    id="min-deposit" 
                    type="number"
                    value={minimumDeposit} 
                    onChange={(e) => setMinimumDeposit(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-deposit">Maximum Deposit (₹)</Label>
                  <Input 
                    id="max-deposit" 
                    type="number"
                    value={maximumDeposit} 
                    onChange={(e) => setMaximumDeposit(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                  <Input 
                    id="platform-fee" 
                    type="number"
                    value={platformFeePercentage} 
                    onChange={(e) => setPlatformFeePercentage(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable Cryptocurrency Payments</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow users to make deposits using cryptocurrencies
                    </p>
                  </div>
                  <Switch 
                    checked={enableCryptoPayments} 
                    onCheckedChange={setEnableCryptoPayments}
                  />
                </div>

                {enableCryptoPayments && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Note</AlertTitle>
                    <AlertDescription>
                      Enabling cryptocurrency payments requires additional configuration. Please ensure you comply with local regulations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSavePaymentSettings} 
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email and push notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email Address</Label>
                  <Input 
                    id="admin-email" 
                    type="email"
                    value={adminEmail} 
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email Address</Label>
                  <Input 
                    id="support-email" 
                    type="email"
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-from-name">Email From Name</Label>
                <Input 
                  id="email-from-name" 
                  value={emailFromName} 
                  onChange={(e) => setEmailFromName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This name will appear as the sender of all system emails.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="font-medium">Email Notifications</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium">Enable Email Notifications</h5>
                    <p className="text-xs text-muted-foreground">
                      Send email notifications for important events
                    </p>
                  </div>
                  <Switch 
                    checked={enableEmailNotifications} 
                    onCheckedChange={setEnableEmailNotifications}
                  />
                </div>

                {enableEmailNotifications && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium">User Registration Emails</h5>
                        <p className="text-xs text-muted-foreground">
                          Send welcome emails when users register
                        </p>
                      </div>
                      <Switch 
                        checked={enableUserRegistrationEmails} 
                        onCheckedChange={setEnableUserRegistrationEmails}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium">Tournament Notifications</h5>
                        <p className="text-xs text-muted-foreground">
                          Send emails about tournament updates
                        </p>
                      </div>
                      <Switch 
                        checked={enableTournamentNotifications} 
                        onCheckedChange={setEnableTournamentNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium">Payment Notifications</h5>
                        <p className="text-xs text-muted-foreground">
                          Send emails for deposits, withdrawals, and winnings
                        </p>
                      </div>
                      <Switch 
                        checked={enablePaymentNotifications} 
                        onCheckedChange={setEnablePaymentNotifications}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable real-time push notifications for mobile and desktop
                    </p>
                  </div>
                  <Switch 
                    checked={enablePushNotifications} 
                    onCheckedChange={setEnablePushNotifications}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveNotificationSettings} 
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security options for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enforce Strong Passwords</h4>
                    <p className="text-sm text-muted-foreground">
                      Require users to create passwords with numbers, letters, and special characters
                    </p>
                  </div>
                  <Switch 
                    checked={enforceStrongPasswords} 
                    onCheckedChange={setEnforceStrongPasswords}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Require Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Force users to set up 2FA for their accounts
                    </p>
                  </div>
                  <Switch 
                    checked={twoFactorRequired} 
                    onCheckedChange={setTwoFactorRequired}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input 
                    id="session-timeout" 
                    type="number"
                    value={sessionTimeout} 
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Maximum Login Attempts</Label>
                  <Input 
                    id="max-login-attempts" 
                    type="number"
                    value={maxLoginAttempts} 
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Account will be locked after this many failed attempts
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable reCAPTCHA</h4>
                    <p className="text-sm text-muted-foreground">
                      Protect forms from spam and abuse
                    </p>
                  </div>
                  <Switch 
                    checked={enableReCaptcha} 
                    onCheckedChange={setEnableReCaptcha}
                  />
                </div>

                {enableReCaptcha && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="recaptcha-site-key">reCAPTCHA Site Key</Label>
                      <Input 
                        id="recaptcha-site-key" 
                        value={reCaptchaSiteKey} 
                        onChange={(e) => setReCaptchaSiteKey(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recaptcha-secret-key">reCAPTCHA Secret Key</Label>
                      <Input 
                        id="recaptcha-secret-key" 
                        type="password"
                        value={reCaptchaSecretKey} 
                        onChange={(e) => setReCaptchaSecretKey(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveSecuritySettings} 
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 