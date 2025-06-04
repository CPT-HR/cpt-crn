
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/DatePicker";

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
        <CardTitle className="text-xl">Vrijeme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Datum</Label>
            <DatePicker
              date={date}
              onDateChange={onDateChange}
              placeholder="Odaberite datum"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalTime">Vrijeme dolaska</Label>
            <Input 
              id="arrivalTime"
              type="time"
              step="60"
              value={arrivalTime}
              onChange={(e) => onTimeChange('arrivalTime', e.target.value)}
              placeholder="HH:mm"
              required 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="completionTime">Vrijeme završetka radova</Label>
            <Input 
              id="completionTime"
              type="time"
              step="60"
              value={completionTime}
              onChange={(e) => onTimeChange('completionTime', e.target.value)}
              placeholder="HH:mm"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Obračunsko vrijeme</Label>
            <div className="p-2 bg-gray-50 border rounded">
              {calculatedHours}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSection;
