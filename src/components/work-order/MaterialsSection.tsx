
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Material } from '@/types/workOrder';

interface MaterialsSectionProps {
  materials: Material[];
  onMaterialChange: (id: string, field: keyof Material, value: string) => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
}

const MaterialsSection: React.FC<MaterialsSectionProps> = ({ 
  materials, 
  onMaterialChange, 
  onAddMaterial, 
  onRemoveMaterial 
}) => {
  const handleAddMaterial = () => {
    onAddMaterial();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Utrošeni materijal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {materials.map((material) => (
          <div key={material.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6 space-y-2">
              <Label htmlFor={`material-name-${material.id}`}>Naziv materijala</Label>
              <Input 
                id={`material-name-${material.id}`}
                value={material.name} 
                onChange={(e) => onMaterialChange(material.id, 'name', e.target.value)}
                placeholder="Bez potrošenog materijala"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor={`material-quantity-${material.id}`}>Količina</Label>
              <Input 
                id={`material-quantity-${material.id}`}
                value={material.quantity} 
                onChange={(e) => onMaterialChange(material.id, 'quantity', e.target.value)} 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="1"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor={`material-unit-${material.id}`}>Jedinica</Label>
              <Input 
                id={`material-unit-${material.id}`}
                value={material.unit} 
                onChange={(e) => onMaterialChange(material.id, 'unit', e.target.value)} 
                placeholder="kom"
              />
            </div>
            <div className="col-span-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => onRemoveMaterial(material.id)}
                disabled={materials.length === 1}
                className="w-full"
              >
                -
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" onClick={handleAddMaterial} variant="outline" className="w-full">
          Dodaj stavku
        </Button>
      </CardContent>
    </Card>
  );
};

export default MaterialsSection;
