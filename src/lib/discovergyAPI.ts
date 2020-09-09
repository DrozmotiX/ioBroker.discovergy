export interface Meter {
  meterId: number;
  serialNumber: string;
  location: Location;
  administrationNumber: string;
  type: string;
  measurementType: string;
  scalingFactor: number;
  currentScalingFactor: number;
  voltageScalingFactor: number;
  internalMeters: number;
}

export interface Location {
  street: string;
  streetNumber: string;
  zip: string;
  city: string;
  country: string;
}
