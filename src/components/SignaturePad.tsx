
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { formatTimestampForSignature } from '@/utils/workOrderParsers';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string, metadata: SignatureMetadata) => void;
  title: string;
}

export interface SignatureMetadata {
  timestamp: string;
  coordinates?: { latitude: number; longitude: number };
  address?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSave, title }) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };
  
  useEffect(() => {
    if (isOpen) {
      setIsGettingLocation(false);
      setLocationError(null);
    }
  }, [isOpen]);
  
  const getLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolokacija nije podržana u vašem pregledniku'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };
  
  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      // Izvuci relevantne dijelove adrese
      const address = data.address || {};
      
      // Prioritet za ulicu: house_number + road, ili road, ili neighbourhood
      let street = '';
      if (address.house_number && address.road) {
        street = `${address.house_number} ${address.road}`;
      } else if (address.road) {
        street = address.road;
      } else if (address.neighbourhood) {
        street = address.neighbourhood;
      } else if (address.suburb) {
        street = address.suburb;
      }
      
      // Grad: town, city, village ili municipality
      const city = address.town || address.city || address.village || address.municipality || 'Nepoznato';
      
      // Država
      const country = address.country || 'Hrvatska';
      
      // Formatiranje kratke adrese
      const shortAddress = [street, city, country]
        .filter(part => part && part.trim().length > 0)
        .join(', ');
      
      return shortAddress || 'Adresa nije dostupna';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Adresa nije dostupna';
    }
  };
  
  const handleBegin = () => {
    setIsEmpty(false);
  };

  const save = async () => {
    if (sigCanvas.current && !isEmpty) {
      setIsGettingLocation(true);
      setLocationError(null);
      
      try {
        const position = await getLocation();
        const { latitude, longitude } = position.coords;
        
        const address = await getAddressFromCoordinates(latitude, longitude);
        
        const timestamp = formatTimestampForSignature(new Date());
        
        const metadata: SignatureMetadata = {
          timestamp,
          coordinates: { latitude, longitude },
          address
        };
        
        const dataURL = sigCanvas.current.toDataURL('image/png');
        onSave(dataURL, metadata);
        onClose();
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError(
          error instanceof Error 
            ? error.message 
            : 'Došlo je do greške prilikom dohvaćanja lokacije'
        );
        
        if (sigCanvas.current) {
          const dataURL = sigCanvas.current.toDataURL('image/png');
          onSave(dataURL, {
            timestamp: formatTimestampForSignature(new Date())
          });
          onClose();
        }
      } finally {
        setIsGettingLocation(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="signature-pad border rounded-md bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "signature-canvas w-full h-64"
            }}
            onBegin={handleBegin}
          />
        </div>
        
        {locationError && (
          <p className="text-xs text-destructive">{locationError}</p>
        )}
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={clear} disabled={isGettingLocation}>
            Očisti
          </Button>
          <Button 
            onClick={save} 
            disabled={isEmpty || isGettingLocation}
            className="relative"
          >
            {isGettingLocation && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Spremi potpis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePad;
