
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface TravelSectionProps {
  fieldTrip: boolean;
  distance: string;
  onFieldTripChange: (checked: boolean) => void;
  onDistanceChange: (value: string) => void;
  companyLocationsCount: number;
  hasDistanceApiKey: boolean;
}

const TravelSection: React.FC<TravelSectionProps> = ({
  fieldTrip,
  distance,
  onFieldTripChange,
  onDistanceChange,
  companyLocationsCount,
  hasDistanceApiKey
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Put</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="fieldTrip" 
            checked={fieldTrip}
            onCheckedChange={onFieldTripChange}
          />
          <Label htmlFor="fieldTrip" className="text-sm font-normal">
            Izlazak na teren
          </Label>
        </div>
        
        {fieldTrip && (
          <div className="space-y-2">
            <Label htmlFor="distance">Prijeđena udaljenost (km)</Label>
            <Input 
              id="distance"
              type="number" 
              min="0" 
              value={distance}
              onChange={(e) => onDistanceChange(e.target.value)} 
              placeholder="Unesite broj kilometara"
              required={fieldTrip}
            />
            {companyLocationsCount === 0 && (
              <p className="text-sm text-amber-600">
                Admin treba postaviti lokacije tvrtke u administraciji za automatsko računanje udaljenosti.
              </p>
            )}
            {!hasDistanceApiKey && companyLocationsCount > 0 && (
              <p className="text-sm text-amber-600">
                Admin treba postaviti Distance Matrix API ključ u administraciji za automatsko računanje udaljenosti.
              </p>
            )}
            {companyLocationsCount > 0 && hasDistanceApiKey && (
              <p className="text-sm text-green-600">
                Udaljenost se automatski računa pomoću distancematrix.ai API-ja.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TravelSection;
