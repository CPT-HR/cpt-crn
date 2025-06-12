
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from '../DatePicker';

interface TimeSectionProps {
  date: Date;
  arrivalTime: string;
  completionTime: string;
  calculatedHours: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (field: 'arrivalTime' | 'completionTime', value: string) => void;
}

const TimeSection: React.FC<TimeSectionProps> = ({
  date,
  arrivalTime,
  completionTime,
  calculatedHours,
  onDateChange,
  onTimeChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Vrijeme izvršavanja radova</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Datum <span className="text-red-500">*</span></Label>
            <DatePicker
              date={date}
              onDateChange={onDateChange}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalTime">Vrijeme dolaska <span className="text-red-500">*</span></Label>
            <Input 
              id="arrivalTime"
              type="time" 
              value={arrivalTime} 
              onChange={(e) => onTimeChange('arrivalTime', e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="completionTime">Vrijeme završetka radova <span className="text-red-500">*</span></Label>
            <Input 
              id="completionTime"
              type="time" 
              value={completionTime} 
              onChange={(e) => onTimeChange('completionTime', e.target.value)} 
              required 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-base font-medium">Ukupno sati rada</Label>
          <div className="p-3 bg-gray-50 rounded-md">
            <span className="text-lg font-medium">{calculatedHours}</span>
            <span className="text-sm text-gray-600 ml-2">(zaokruženo na pola sata)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSection;
