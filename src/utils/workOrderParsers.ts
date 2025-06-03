
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

// Attempt to reconstruct arrival and completion times from hours
export const reconstructTimesFromHours = (hours: number | null): ParsedTimes => {
  if (!hours || hours <= 0) {
    return { arrivalTime: '', completionTime: '' };
  }
  
  // Default assumption: work started at 9:00 AM
  const defaultStartHour = 9;
  const defaultStartMinute = 0;
  
  const startTime = `${defaultStartHour.toString().padStart(2, '0')}:${defaultStartMinute.toString().padStart(2, '0')}`;
  
  // Calculate end time by adding the hours
  const totalMinutes = Math.round(hours * 60);
  const endHour = defaultStartHour + Math.floor(totalMinutes / 60);
  const endMinute = defaultStartMinute + (totalMinutes % 60);
  
  // Handle minute overflow
  const finalEndHour = endHour + Math.floor(endMinute / 60);
  const finalEndMinute = endMinute % 60;
  
  const endTime = `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`;
  
  return {
    arrivalTime: startTime,
    completionTime: endTime
  };
};

// Format hours number to display format
export const formatHoursToDisplay = (hours: number | null): string => {
  if (!hours || hours <= 0) return '0h00min';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}min`;
};
