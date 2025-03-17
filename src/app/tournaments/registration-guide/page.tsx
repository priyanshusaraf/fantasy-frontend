import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { ChevronRight, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

export default function TournamentRegistrationGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Tournament Registration Guide
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Follow this step-by-step guide to register for pickleball tournaments through our platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Find a Tournament</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Browse available tournaments on the <Link href="/tournaments" className="text-primary underline">Tournaments page</Link>. 
                You can filter by date, location, or tournament type to find the perfect event for you.
              </p>
              <div className="bg-muted rounded-md p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Tip:</span> Use the search function to quickly find tournaments by name or location.
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">What to look for:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tournament dates and location</li>
                  <li>Registration deadline</li>
                  <li>Entry fee</li>
                  <li>Skill divisions and categories</li>
                  <li>Tournament format</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Check Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Before registering, ensure you meet the eligibility requirements for the tournament:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Age restrictions (if applicable)</li>
                <li>Skill level requirements</li>
                <li>Membership requirements (some tournaments require association membership)</li>
                <li>Availability for all scheduled dates</li>
              </ul>
              <div className="bg-muted rounded-md p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Important:</span> Misrepresenting your skill level may result in disqualification.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Create an Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you haven't already, you'll need to create an account on our platform to register for tournaments:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click the "Sign Up" button in the top navigation</li>
                <li>Fill out the required information</li>
                <li>Verify your email address</li>
                <li>Complete your player profile with accurate information</li>
              </ol>
              <div className="bg-muted rounded-md p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Tip:</span> Make sure your profile information is accurate and up-to-date, as tournament organizers will use this for communications and seeding.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 4: Register and Pay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Once you've found a tournament and confirmed your eligibility:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click the "Register" button on the tournament page</li>
                <li>Select your events/divisions (singles, doubles, mixed doubles)</li>
                <li>For partner events, either:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Select an existing partner who has an account</li>
                    <li>Send a partner request to someone by email</li>
                    <li>Indicate you need a partner (if tournament offers partner matching)</li>
                  </ul>
                </li>
                <li>Review your registration details</li>
                <li>Process payment for the entry fee</li>
                <li>Receive confirmation email</li>
              </ol>
              <div className="bg-muted rounded-md p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Important:</span> Registration is not complete until payment is processed. Some tournaments have limited spots that fill quickly.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 5: Prepare for the Tournament</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                After successful registration:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Mark the tournament dates on your calendar</li>
                <li>Arrange travel and accommodation if needed</li>
                <li>Check the tournament page regularly for updates or changes</li>
                <li>Review the tournament rules and format</li>
                <li>Ensure you have the proper equipment and attire</li>
              </ul>
              <p className="mt-4">
                The tournament director will typically send out additional information as the event approaches, including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Final schedule</li>
                <li>Court assignments</li>
                <li>Check-in procedures</li>
                <li>Any last-minute changes</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">What if I need to withdraw?</h4>
                <p className="text-sm text-muted-foreground">
                  Each tournament has its own withdrawal and refund policy. Check the tournament details page or contact the organizer directly.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Can I change divisions after registering?</h4>
                <p className="text-sm text-muted-foreground">
                  Division changes are sometimes allowed before the registration deadline. Contact the tournament director to request changes.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">What if my partner cancels?</h4>
                <p className="text-sm text-muted-foreground">
                  You can usually find a replacement partner before the tournament. Some events offer waitlists for players seeking partners.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Are there waitlists if the tournament is full?</h4>
                <p className="text-sm text-muted-foreground">
                  Many tournaments offer waitlists. If spots become available, waitlisted players will be notified in order.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">How do I know if my registration is confirmed?</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive a confirmation email after registration and payment. You can also check your registered tournaments in your profile.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you encounter any issues during registration or have questions, we're here to help:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[80px]">Email:</span>
                  <span>support@pickleballfantasy.com</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[80px]">Phone:</span>
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[80px]">Hours:</span>
                  <span>Monday-Friday, 9am-5pm ET</span>
                </div>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ready to Register?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Browse our available tournaments and start your registration process now.
              </p>
              <Link href="/tournaments">
                <Button className="w-full">
                  Find Tournaments
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 