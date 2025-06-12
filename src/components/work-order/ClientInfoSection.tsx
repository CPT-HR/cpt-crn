
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ClientData {
  clientCompanyName: string;
  clientStreetAddress: string;
  clientCity: string;
  clientCountry: string;
  clientOib: string;
  clientFirstName: string;
  clientLastName: string;
  clientMobile: string;
  clientEmail: string;
  orderForCustomer: boolean;
}

interface ClientInfoSectionProps {
  data: ClientData;
  onChange: (field: keyof ClientData, value: string | boolean) => void;
  countries: string[];
  showValidation?: boolean;
}

const ClientInfoSection: React.FC<ClientInfoSectionProps> = ({ 
  data, 
  onChange, 
  countries, 
  showValidation = false 
}) => {
  const getFieldClassName = (value: string, isRequired: boolean = true) => {
    const baseClassName = "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
    
    if (showValidation && isRequired && !value.trim()) {
      return cn(baseClassName, "border-red-500 border-2");
    }
    
    return cn(baseClassName, "border-input");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Podaci o naručitelju</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientCompanyName">Ime tvrtke *</Label>
            <Input 
              id="clientCompanyName"
              value={data.clientCompanyName} 
              onChange={(e) => onChange('clientCompanyName', e.target.value)} 
              required 
              className={getFieldClassName(data.clientCompanyName)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientOib">OIB *</Label>
            <Input 
              id="clientOib"
              value={data.clientOib} 
              onChange={(e) => onChange('clientOib', e.target.value)} 
              required 
              className={getFieldClassName(data.clientOib)}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <Label className="text-base font-medium">Adresa tvrtke</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="clientStreetAddress">Ulica i broj *</Label>
              <Input 
                id="clientStreetAddress"
                value={data.clientStreetAddress} 
                onChange={(e) => onChange('clientStreetAddress', e.target.value)} 
                placeholder="Ilica 1"
                required 
                className={getFieldClassName(data.clientStreetAddress)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCity">Grad *</Label>
              <Input 
                id="clientCity"
                value={data.clientCity} 
                onChange={(e) => onChange('clientCity', e.target.value)} 
                placeholder="Zagreb"
                required 
                className={getFieldClassName(data.clientCity)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCountry">Država</Label>
              <Select value={data.clientCountry} onValueChange={(value) => onChange('clientCountry', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientFirstName">Ime *</Label>
            <Input 
              id="clientFirstName"
              value={data.clientFirstName} 
              onChange={(e) => onChange('clientFirstName', e.target.value)} 
              required 
              className={getFieldClassName(data.clientFirstName)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientLastName">Prezime *</Label>
            <Input 
              id="clientLastName"
              value={data.clientLastName} 
              onChange={(e) => onChange('clientLastName', e.target.value)} 
              required 
              className={getFieldClassName(data.clientLastName)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientMobile">Broj mobitela *</Label>
            <Input 
              id="clientMobile"
              value={data.clientMobile} 
              onChange={(e) => onChange('clientMobile', e.target.value)} 
              required 
              className={getFieldClassName(data.clientMobile)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email *</Label>
            <Input 
              id="clientEmail"
              type="email" 
              value={data.clientEmail} 
              onChange={(e) => onChange('clientEmail', e.target.value)} 
              required 
              className={getFieldClassName(data.clientEmail)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="orderForCustomer" 
            checked={data.orderForCustomer}
            onCheckedChange={(checked) => onChange('orderForCustomer', checked as boolean)}
          />
          <Label htmlFor="orderForCustomer" className="text-sm font-normal">
            Naručitelj naručuje radove za korisnika
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfoSection;
