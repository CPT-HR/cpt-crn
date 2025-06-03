
import { WorkItem, Material } from '@/types/workOrder';
import { SignatureMetadata } from '@/components/SignaturePad';

export const parseTextToWorkItems = (text: string | null | undefined): WorkItem[] => {
  if (!text) return [{ id: '1', text: '' }];
  
  const items = text.split('\n').map(line => line.replace(/^•\s*/, '')).filter(line => line.trim().length > 0);
  if (items.length === 0) return [{ id: '1', text: '' }];
  
  return items.map((item, index) => ({
    id: (index + 1).toString(),
    text: item.trim()
  }));
};

export const parseMaterials = (materialsData: any): Material[] => {
  if (!materialsData || !Array.isArray(materialsData)) {
    return [{ id: '1', name: '', quantity: '', unit: '' }];
  }
  
  if (materialsData.length === 0) {
    return [{ id: '1', name: '', quantity: '', unit: '' }];
  }
  
  return materialsData.map((material, index) => ({
    id: (index + 1).toString(),
    name: material.name || '',
    quantity: material.quantity?.toString() || '',
    unit: material.unit || ''
  }));
};

export interface ParsedAddress {
  street: string;
  city: string;
  country: string;
}

export const parseAddress = (fullAddress: string): ParsedAddress => {
  if (!fullAddress) {
    return { street: '', city: '', country: 'Hrvatska' };
  }
  
  const parts = fullAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    return {
      street: parts[0],
      city: parts[1],
      country: parts[2]
    };
  } else if (parts.length === 2) {
    return {
      street: parts[0],
      city: parts[1],
      country: 'Hrvatska'
    };
  } else {
    return {
      street: parts[0] || '',
      city: '',
      country: 'Hrvatska'
    };
  }
};

export const formatAddress = (street: string, city: string, country: string): string => {
  const parts = [street, city, country].filter(part => part && part.trim().length > 0);
  return parts.join(', ');
};

export const parseSignatureMetadata = (
  timestamp: string | null,
  coordinates: any,
  address: string | null
): SignatureMetadata | undefined => {
  if (!timestamp) return undefined;
  
  let parsedCoordinates;
  if (coordinates && typeof coordinates === 'string') {
    // Parse PostgreSQL point format: (longitude,latitude)
    const match = coordinates.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      parsedCoordinates = {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2])
      };
    }
  }
  
  return {
    timestamp, // This is guaranteed to be a string since we check for null above
    coordinates: parsedCoordinates,
    address: address || undefined
  };
};

export const formatTimestampForSignature = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('hr-HR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatMinutesToDisplay = (minutes: number | null | undefined): string => {
  if (!minutes || minutes === 0) return '0h00min';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h${remainingMinutes.toString().padStart(2, '0')}min`;
};

export const parseDisplayToMinutes = (displayTime: string): number => {
  if (!displayTime || displayTime === '0h00min') return 0;
  
  const match = displayTime.match(/(\d+)h(\d+)min/);
  if (!match) return 0;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  return hours * 60 + minutes;
};

export const calculateBillableHours = (arrivalTime: string, completionTime: string): string => {
  if (!arrivalTime || !completionTime) return '0h00min';
  
  const arrival = new Date(`2000-01-01T${arrivalTime}`);
  const completion = new Date(`2000-01-01T${completionTime}`);
  
  let diffMs = completion.getTime() - arrival.getTime();
  
  // Handle case where completion time is next day
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
  }
  
  const totalMinutes = Math.round(diffMs / (1000 * 60));
  
  return formatMinutesToDisplay(totalMinutes);
};
