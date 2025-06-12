
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface WorkItem {
  id: string;
  text: string;
}

interface WorkDetailsData {
  description: WorkItem[];
  foundCondition: WorkItem[];
  performedWork: WorkItem[];
  technicianComment: WorkItem[];
}

interface WorkDetailsSectionProps {
  data: WorkDetailsData;
  onWorkItemChange: (section: keyof WorkDetailsData, id: string, value: string) => void;
  onAddWorkItem: (section: keyof WorkDetailsData) => void;
  onRemoveWorkItem: (section: keyof WorkDetailsData, id: string) => void;
}

const WorkDetailsSection: React.FC<WorkDetailsSectionProps> = ({ 
  data, 
  onWorkItemChange, 
  onAddWorkItem, 
  onRemoveWorkItem 
}) => {
  const renderWorkItemsSection = (
    title: string,
    placeholder: string,
    section: keyof WorkDetailsData,
    required: boolean = false
  ) => (
    <div className="space-y-4">
      <Label className="text-base font-medium">{title}</Label>
      {data[section].map((item, index) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-10 space-y-2">
            <Input 
              value={item.text} 
              onChange={(e) => onWorkItemChange(section, item.id, e.target.value)} 
              placeholder={placeholder}
              required={required && index === 0}
            />
          </div>
          <div className="col-span-2">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => onRemoveWorkItem(section, item.id)}
              disabled={data[section].length === 1}
              className="w-full"
            >
              -
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" onClick={() => onAddWorkItem(section)} variant="outline" className="w-full">
        Dodaj red
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Podaci o radovima</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderWorkItemsSection(
          'Opis kvara/problema',
          'Unesite opis kvara ili problema',
          'description',
          true
        )}

        <Separator />

        {renderWorkItemsSection(
          'Zatečeno stanje',
          'Opišite zatečeno stanje',
          'foundCondition',
          true
        )}

        <Separator />

        {renderWorkItemsSection(
          'Izvršeni radovi',
          'Opišite izvršene radove',
          'performedWork',
          true
        )}

        <Separator />

        {renderWorkItemsSection(
          'Komentar tehničara',
          'Dodatni komentari ili napomene',
          'technicianComment'
        )}
      </CardContent>
    </Card>
  );
};

export default WorkDetailsSection;
