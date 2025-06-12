
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
        <CardTitle className="text-xl">Terenski rad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="fieldTrip" 
            checked={fieldTrip}
            onCheckedChange={onFieldTripChange}
          />
          <Label htmlFor="fieldTrip" className="text-sm font-normal">
            Terenski rad (rad izvan ureda)
          </Label>
        </div>

        {fieldTrip && (
          <div className="space-y-2">
            <Label htmlFor="distance">
              Prijeđena udaljenost (km) <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="distance"
              type="number" 
              step="0.1"
              value={distance} 
              onChange={(e) => onDistanceChange(e.target.value)}
              placeholder="Unesite udaljenost u kilometrima"
              required={fieldTrip}
            />
            
            {companyLocationsCount === 0 && (
              <p className="text-sm text-yellow-600">
                ⚠️ Nema lokacija tvrtke u sustavu. Dodajte lokacije u admin panelu za automatsko računanje udaljenosti.
              </p>
            )}
            
            {companyLocationsCount > 0 && !hasDistanceApiKey && (
              <p className="text-sm text-yellow-600">
                ⚠️ Nema API ključa za računanje udaljenosti. Dodajte ga u globalnim postavkama za automatsko računanje.
              </p>
            )}
            
            {companyLocationsCount > 0 && hasDistanceApiKey && (
              <p className="text-sm text-green-600">
                ✅ Udaljenost se automatski računa na temelju adrese klijenta.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TravelSection;
