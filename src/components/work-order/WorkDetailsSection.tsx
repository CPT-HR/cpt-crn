
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
  showValidation?: boolean;
}

const WorkDetailsSection: React.FC<WorkDetailsSectionProps> = ({ 
  data, 
  onWorkItemChange, 
  onAddWorkItem, 
  onRemoveWorkItem,
  showValidation = false
}) => {
  const hasContent = (items: WorkItem[]): boolean => {
    return items.some(item => item.text.trim().length > 0);
  };

  const getFieldClassName = (value: string, isRequired: boolean = false, section?: keyof WorkDetailsData) => {
    console.log('WorkDetailsSection validation check:', { value, isRequired, showValidation, section });
    
    const baseClassName = "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
    
    // For required sections, check if the entire section has content
    if (showValidation && isRequired && section) {
      const sectionHasContent = hasContent(data[section]);
      console.log('Section content check:', { section, sectionHasContent });
      if (!sectionHasContent) {
        console.log('Showing red border for empty required section');
        return cn(baseClassName, "border-red-500 border-2");
      }
    }
    
    return cn(baseClassName, "border-input");
  };

  const renderWorkItemsSection = (
    title: string,
    placeholder: string,
    section: keyof WorkDetailsData,
    required: boolean = false
  ) => (
    <div className="space-y-4">
      <Label className="text-base font-medium">{title}{required && ' *'}</Label>
      {data[section].map((item, index) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-10 space-y-2">
            <Input 
              value={item.text} 
              onChange={(e) => onWorkItemChange(section, item.id, e.target.value)} 
              placeholder={placeholder}
              required={required && index === 0}
              className={getFieldClassName(item.text, required, section)}
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
          'foundCondition'
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
