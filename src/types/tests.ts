export interface TestCatalogLocation {
  locationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface TestCatalogItem {
  testId: string;
  heading: string;
  subheading: string;
  description: string;
  instructions: string;
  priceUSD: number;
  durationMinutes: number;
  scheduledAt: string;
  allowAllLocations: boolean;
  allowedLocationIds: string[];
  locations: TestCatalogLocation[];
}
