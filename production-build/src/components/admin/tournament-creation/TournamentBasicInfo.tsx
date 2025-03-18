import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';

const tournamentTypes = [
  { value: 'SINGLES', label: 'Singles' },
  { value: 'DOUBLES', label: 'Doubles' },
  { value: 'MIXED_DOUBLES', label: 'Mixed Doubles' },
  { value: 'ROUND_ROBIN', label: 'Round Robin' },
  { value: 'KNOCKOUT', label: 'Knockout' },
  { value: 'LEAGUE', label: 'League' },
];

interface TournamentBasicInfoProps {
  formData: {
    name: string;
    description: string;
    type: string;
    isTeamBased: boolean;
    startDate: string;
    endDate: string;
    registrationOpenDate: string;
    registrationCloseDate: string;
    location: string;
    maxParticipants: number;
    entryFee: number;
    prizeMoney: number;
    rules: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function TournamentBasicInfo({ formData, onChange }: TournamentBasicInfoProps) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="name">Tournament Name</Label>
          <Input
            id="name"
            placeholder="Enter tournament name"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter tournament description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Tournament Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => onChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tournament type" />
              </SelectTrigger>
              <SelectContent>
                {tournamentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tournament Structure</Label>
            <RadioGroup
              value={formData.isTeamBased ? 'team' : 'individual'}
              onValueChange={(value) => onChange('isTeamBased', value === 'team')}
              className="flex space-x-4"
            >
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="individual" />
                </FormControl>
                <FormLabel className="font-normal">Individual</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="team" />
                </FormControl>
                <FormLabel className="font-normal">Team-based</FormLabel>
              </FormItem>
            </RadioGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => onChange('startDate', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => onChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="registrationOpenDate">Registration Open Date</Label>
            <Input
              id="registrationOpenDate"
              type="datetime-local"
              value={formData.registrationOpenDate}
              onChange={(e) => onChange('registrationOpenDate', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationCloseDate">Registration Close Date</Label>
            <Input
              id="registrationCloseDate"
              type="datetime-local"
              value={formData.registrationCloseDate}
              onChange={(e) => onChange('registrationCloseDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Enter tournament location"
              value={formData.location}
              onChange={(e) => onChange('location', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="2"
              value={formData.maxParticipants}
              onChange={(e) => onChange('maxParticipants', parseInt(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="entryFee">Entry Fee</Label>
            <Input
              id="entryFee"
              type="number"
              min="0"
              step="0.01"
              value={formData.entryFee}
              onChange={(e) => onChange('entryFee', parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizeMoney">Prize Money</Label>
            <Input
              id="prizeMoney"
              type="number"
              min="0"
              step="0.01"
              value={formData.prizeMoney}
              onChange={(e) => onChange('prizeMoney', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">Tournament Rules</Label>
          <Textarea
            id="rules"
            placeholder="Enter tournament rules"
            value={formData.rules}
            onChange={(e) => onChange('rules', e.target.value)}
            rows={6}
          />
        </div>
      </CardContent>
    </Card>
  );
} 