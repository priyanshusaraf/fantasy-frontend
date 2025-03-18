import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios';

interface BankAccount {
  id: number;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  isVerified: boolean;
}

export default function BankAccountForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    accountType: 'savings',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing bank account details
  useEffect(() => {
    if (session?.user) {
      fetchBankAccount();
    }
  }, [session]);

  const fetchBankAccount = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/user/bank-account');
      if (response.data.hasBankAccount) {
        setBankAccount(response.data.bankAccount);
        setFormData({
          ...formData,
          accountHolderName: response.data.bankAccount.accountHolderName,
          accountNumber: '',
          confirmAccountNumber: '',
          ifsc: response.data.bankAccount.ifsc,
          accountType: response.data.bankAccount.accountType,
        });
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
      setError('Failed to load bank account details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      accountType: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!formData.accountHolderName.trim()) {
      setError('Account holder name is required');
      return;
    }

    if (!formData.accountNumber) {
      setError('Account number is required');
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setError('Account numbers do not match');
      return;
    }

    if (!formData.ifsc) {
      setError('IFSC code is required');
      return;
    }

    // IFSC format validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(formData.ifsc.toUpperCase())) {
      setError('Invalid IFSC code format');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post('/api/user/bank-account', {
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc.toUpperCase(),
        accountType: formData.accountType,
      });

      setSuccess('Bank account details saved successfully');
      fetchBankAccount(); // Refresh data
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      setError(error.response?.data?.error || 'Failed to save bank account details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Bank Account Details</CardTitle>
        <CardDescription>
          {bankAccount 
            ? "Update your bank account information for prize payouts" 
            : "Add your bank account information to receive prize payouts"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {bankAccount && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Current Account</p>
            <p className="text-sm">Account: {bankAccount.accountNumber}</p>
            <p className="text-sm">IFSC: {bankAccount.ifsc}</p>
            <div className="flex items-center mt-1">
              <div className={`h-2 w-2 rounded-full mr-2 ${bankAccount.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className="text-xs font-medium">{bankAccount.isVerified ? 'Verified' : 'Pending Verification'}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                placeholder="Enter account holder name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                type="password"
                placeholder="Enter account number"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
              <Input
                id="confirmAccountNumber"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={handleChange}
                type="text"
                placeholder="Confirm account number"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                name="ifsc"
                value={formData.ifsc}
                onChange={handleChange}
                placeholder="e.g., SBIN0123456"
                required
              />
              <p className="text-xs text-gray-500">
                Indian Financial System Code. Find it on your cheque or bank's website.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              bankAccount ? "Update Account" : "Save Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-xs text-gray-500">
        <p>Your bank account details are secure and encrypted.</p>
        <p>For any issues, please contact support.</p>
      </CardFooter>
    </Card>
  );
} 