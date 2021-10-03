export interface Campground {
  facility_name: string;
}

export interface Campsite {
  availabilities: CampsiteAvailabilities;
  campsite_id: string;
  campsite_reserve_type: CampsiteReserveType;
  campsite_type: CampsiteType;
  capacity_rating: CapacityRating;
  loop: string;
  max_num_people: number;
  min_num_people: number;
  quantities: null; // ??
  site: string;
  type_of_use: TypeOfUse;
}

export type CampsiteAvailabilities = Record<string, CampsiteAvailability | undefined>;

export enum CampsiteAvailability {
  Available = 'Available',
  NotAvailable = 'Not Available',
  NotReservable = 'Not Reservable',
  NotReservableManagement = 'Not Reservable Management',
  Reserved = 'Reserved',
}

export enum CampsiteReserveType {
  SiteSpecific = 'Site-Specific',
}

export enum CampsiteType {
  GroupStandardNonelectric = 'GROUP STANDARD NONELECTRIC',
  Management = 'MANAGEMENT',
  StandardNonelectric = 'STANDARD NONELECTRIC',
  TentOnlyNonelectric = 'TENT ONLY NONELECTRIC',
  WalkTo = 'WALK TO',
}

export enum CapacityRating {
  Double = 'Double',
  Empty = '',
  Group = 'Group',
  Single = 'Single',
}

export enum TypeOfUse {
  Overnight = 'Overnight',
}
