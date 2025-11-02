export type EventType = "CME" | "GST" | "IPS" | "FLR" | "SEP" | "MPC" | "RBE" | "HSS" | "WSA";

export interface DonkiEvent {
  messageType: string;
  messageID: string;
  messageIssueTime: string;
  [key: string]: any; // Allow other properties
}

export const eventTypes: { [key in EventType]: string } = {
  CME: "Coronal Mass Ejection",
  GST: "Geomagnetic Storm",
  IPS: "Interplanetary Shock",
  FLR: "Solar Flare",
  SEP: "Solar Energetic Particle",
  MPC: "Magnetopause Crossing",
  RBE: "Radiation Belt Enhancement",
  HSS: "High Speed Stream",
  WSA: "WSA-ENLIL+Cone Model",
};

export const ipsLocations = ["ALL", "Earth", "MESSENGER", "STEREO A", "STEREO B"];

export const ipsCatalogs = ["ALL", "SWRC_CATALOG", "JANG_ET_AL_CATALOG", "WINSLOW_ET_AL_CATALOG"];
