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

export type FestivalTeam = {
  id: string;
  name: string;
  color: "red" | "pink" | "yellow" | "white";
  emoji: string;
  created_at?: string;
};

export type ScoreEvent = {
  id: string;
  team_id: string;
  points: number;
  category:
    | "bingo_bouillet"
    | "bouille_pong"
    | "capture_the_flag"
    | "alcolympics"
    | "cocktail_contest"
    | "happening"
    | "costume_contest";
  description?: string | null;
  added_by?: string | null;
  created_at?: string;
  team?: FestivalTeam;
};

export type BPDuo = {
  id: string;
  name: string;
  festival_team_id: string;
  color: "red" | "pink" | "yellow" | "white";
  pool?: string | null;
  created_at?: string;
  festival_team?: FestivalTeam;
};

export type BPMatch = {
  id: string;
  duo1_id: string;
  duo2_id: string;
  score1: number;
  score2: number;
  round: "pool" | "quarter" | "semi" | "final";
  pool?: string | null;
  completed: boolean;
  created_at?: string;
  duo1?: BPDuo;
  duo2?: BPDuo;
};

export const CATEGORY_LABELS: Record<ScoreEvent["category"], string> = {
  bingo_bouillet:   "🎯 Bingo Bouillet",
  bouille_pong:     "🏓 Bouille Pong",
  capture_the_flag: "🚩 Capture the Flag",
  alcolympics:      "🏅 Alcolympics",
  cocktail_contest: "🍹 Cocktail Contest",
  happening:        "👠 Happening",
  costume_contest:  "👗 Costume Contest",
};

export const TEAM_COLORS: Record<
  FestivalTeam["color"],
  { bg: string; text: string; border: string }
> = {
  red:    { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  pink:   { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  yellow: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  white:  { bg: "#F9FAFB", text: "#374151", border: "#D1D5DB" },
};

// Joined types used in queries
export type CarWithDriver = Car & { driver: User };
export type CarWithPassengers = Car & { passengers: User[] };
export type TentWithHost = Tent & { host: User };
export type TentWithGuests = Tent & { guests: User[] };
