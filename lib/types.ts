export type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
};

export type User = {
  id: string;
  name: string;
  phone: string | null;
  dietary: string | null;
  beer_level: number | null;
  wine_level: string | null;
  spirits_level: number | null;
  snoring_warning: boolean;
  present_fri_evening?: boolean;
  present_sat_midday?:  boolean;
  present_sat_evening?: boolean;
  present_sun_midday?:  boolean;
  present_sun_evening?: boolean;
  present_mon_midday?:  boolean;
};

export type Car = {
  id: string;
  event_id: string;
  driver_id: string;
  address: string;
  seats_total: number;
  departure_datetime: string;
  note?: string | null;
  stops?: string[];
};

export type CarPassenger = {
  car_id: string;
  user_id: string;
};

export type Tent = {
  id: string;
  event_id: string;
  host_id: string;
  name: string;
  type: string;
  capacity: number;
};

export type TentGuest = {
  tent_id: string;
  user_id: string;
};

export type Announcement = {
  id: string;
  event_id: string;
  message: string;
  pinned: boolean;
  created_at: string;
  reactions: Record<string, number>;
};

export type DJ = {
  id: string;
  event_id: string;
  name: string;
  photo_url: string | null;
  bio: string | null;
  set_time: string | null;
  revealed: boolean;
};

export type Bike = {
  id: string
  event_id: string
  rider_id: string
  departure_address?: string | null
  departure_datetime?: string | null
  bike_model?: string | null
  note?: string | null
  created_at?: string
  rider?: { id: string; name: string }
}

// Joined types used in queries
export type CarWithDriver = Car & { driver: User };
export type CarWithPassengers = Car & { passengers: User[] };
export type TentWithHost = Tent & { host: User };
export type TentWithGuests = Tent & { guests: User[] };
