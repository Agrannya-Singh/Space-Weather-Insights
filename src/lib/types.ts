export type EventType = "CME" | "GST" | "IPS" | "FLR" | "SEP" | "MPC" | "RBE" | "HSS" | "WSA";

export interface DonkiEvent {
  messageType: string;
  messageID: string;
  messageIssueTime: string;
  [key: string]: any; // Allow other properties
}
