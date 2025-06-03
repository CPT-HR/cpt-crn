
import { SignatureMetadata } from '@/components/SignaturePad';
import { WorkItem, Material } from '@/types/workOrder';

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

// Parse text to work items
export const parseTextToWorkItems = (text: string | null): WorkItem[] => {
  if (!text) return [{ id: '1', text: '' }];
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return [{ id: '1', text: '' }];
  
  return lines.map((line, index) => ({
    id: (index + 1).toString(),
    text: line.replace(/^•\s*/, '').trim()
  }));
};

// Parse materials from JSONB
export const parseMaterials = (materialsData: any): Material[] => {
  if (!materialsData || !Array.isArray(materialsData)) {
    return [{ id: '1', name: '', quantity: '', unit: '' }];
  }
  
  return materialsData.map((material, index) => ({
    id: (index + 1).toString(),
    name: material.name || '',
    quantity: material.quantity?.toString() || '',
    unit: material.unit || ''
  }));
};

// Parse address from combined field
export const parseAddress = (addressString: string) => {
  if (!addressString) return { street: '', city: 'Zagreb', country: 'Hrvatska' };
  
  const parts = addressString.split(', ');
  if (parts.length >= 3) {
    return {
      street: parts[0].trim(),
      city: parts[1].trim(),
      country: parts[2].trim()
    };
  } else if (parts.length === 2) {
    return {
      street: parts[0].trim(),
      city: parts[1].trim(),
      country: 'Hrvatska'
    };
  } else {
    return {
      street: addressString.trim(),
      city: 'Zagreb',
      country: 'Hrvatska'
    };
  }
};

// Calculate billable hours based on arrival and completion time
export const calculateBillableHours = (arrival: string, completion: string) => {
  if (!arrival || !completion) return '0h00min';
  
  const [arrivalHour, arrivalMin] = arrival.split(':').map(Number);
  const [completionHour, completionMin] = completion.split(':').map(Number);
  
  const arrivalMinutes = arrivalHour * 60 + arrivalMin;
  const completionMinutes = completionHour * 60 + completionMin;
  
  if (completionMinutes <= arrivalMinutes) return '0h00min';
  
  const diffMinutes = completionMinutes - arrivalMinutes;
  const billableMinutes = Math.ceil(diffMinutes / 30) * 30;
  
  return formatMinutesToDisplay(billableMinutes);
};
