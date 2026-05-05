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
};

export type Car = {
  id: string;
  event_id: string;
  driver_id: string;
  address: string;
  seats_total: number;
  departure_datetime: string;
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

// Joined types used in queries
export type CarWithDriver = Car & { driver: User };
export type CarWithPassengers = Car & { passengers: User[] };
export type TentWithHost = Tent & { host: User };
export type TentWithGuests = Tent & { guests: User[] };
