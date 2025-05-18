
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
  const [locationMetadata, setLocationMetadata] = useState<SignatureMetadata>({
    timestamp: new Date().toISOString(),
  });
  
  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };
  
  useEffect(() => {
    if (isOpen) {
      // Reset states when opening
      setIsGettingLocation(false);
      setLocationError(null);
      setLocationMetadata({
        timestamp: new Date().toISOString(),
      });
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
      return data.display_name;
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
        // Get current location
        const position = await getLocation();
        const { latitude, longitude } = position.coords;
        
        // Get address from coordinates
        const address = await getAddressFromCoordinates(latitude, longitude);
        
        // Create timestamp in CET timezone (Zagreb)
        const timestamp = new Date().toLocaleString('hr-HR', {
          timeZone: 'Europe/Zagreb',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
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
        
        // Allow saving without location if there's an error
        if (sigCanvas.current) {
          const dataURL = sigCanvas.current.toDataURL('image/png');
          onSave(dataURL, {
            timestamp: new Date().toLocaleString('hr-HR', {
              timeZone: 'Europe/Zagreb',
              hour12: false
            })
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
