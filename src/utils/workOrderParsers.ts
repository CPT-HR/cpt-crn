
import { SignatureMetadata } from '@/components/SignaturePad';

export interface ParsedTimes {
  arrivalTime: string;
  completionTime: string;
}

// Parse PostgreSQL point format: (longitude,latitude) to coordinates object
export const parseCoordinatesFromPoint = (pointString: string | null): { latitude: number; longitude: number } | undefined => {
  if (!pointString) return undefined;
  
  try {
    // Remove parentheses and split by comma
    const cleanPoint = pointString.replace(/[()]/g, '');
    const [longitude, latitude] = cleanPoint.split(',').map(coord => parseFloat(coord.trim()));
    
    if (isNaN(longitude) || isNaN(latitude)) return undefined;
    
    return { latitude, longitude };
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return undefined;
  }
};

// Parse signature metadata from database fields
export const parseSignatureMetadata = (
  timestamp: string | null,
  coordinates: any,
  address: string | null
): SignatureMetadata | undefined => {
  if (!timestamp && !coordinates && !address) return undefined;
  
  const metadata: SignatureMetadata = {
    timestamp: timestamp || new Date().toLocaleString('hr-HR', {
      timeZone: 'Europe/Zagreb',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  };
  
  if (coordinates) {
    metadata.coordinates = parseCoordinatesFromPoint(coordinates);
  }
  
  if (address) {
    metadata.address = address;
  }
  
  return metadata;
};

// Format minutes to display format (Hhmmm)
export const formatMinutesToDisplay = (minutes: number | null): string => {
  if (!minutes || minutes <= 0) return '0h00min';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h${remainingMinutes.toString().padStart(2, '0')}min`;
};

// Convert display format back to minutes
export const parseDisplayToMinutes = (displayTime: string): number => {
  const match = displayTime.match(/(\d+)h(\d+)min/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  return hours * 60 + minutes;
};
