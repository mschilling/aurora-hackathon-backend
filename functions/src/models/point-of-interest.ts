import { ILocation } from "./common";

export interface IPointOfInterest {
  id: string;
  name: string;
  description: string;
  location: ILocation;
  googleId?: string;
  foursquareId?: string;
}
