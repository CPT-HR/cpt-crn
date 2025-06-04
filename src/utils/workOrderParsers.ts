
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

// Format time from HH:mm:ss to HH:mm
export const formatTimeToHHMM = (time: string | null): string => {
  if (!time) return '';
  
  // If already in HH:mm format, return as is
  if (time.length === 5 && time.includes(':')) {
    return time;
  }
  
  // If in HH:mm:ss format, remove seconds
  if (time.length === 8 && time.split(':').length === 3) {
    return time.substring(0, 5);
  }
  
  return time;
};

// Format timestamp for signature metadata display
export const formatTimestampForSignature = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}-${month}-${year} u ${hours}:${minutes}:${seconds}`;
};

// Parse signature metadata from database fields
export const parseSignatureMetadata = (
  timestamp: string | null,
  coordinates: any,
  address: string | null
): SignatureMetadata | undefined => {
  if (!timestamp && !coordinates && !address) return undefined;
  
  const metadata: SignatureMetadata = {
    timestamp: timestamp ? formatTimestampForSignature(timestamp) : formatTimestampForSignature(new Date())
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
