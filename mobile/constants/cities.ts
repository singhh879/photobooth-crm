export const CITIES = ['Delhi', 'Mumbai', 'Nagpur', 'Hyderabad'] as const;
export type City = typeof CITIES[number];
