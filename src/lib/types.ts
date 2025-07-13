export type EventType = 'GST' | 'IPS' | 'FLR' | 'SEP' | 'MPC' | 'RBE' | 'HSS' | 'WSA';

export interface DonkiEvent {
  [key: string]: any;
}

export const eventTypes: { value: EventType, label: string }[] = [
    { value: 'GST', label: 'Geomagnetic Storm' },
    { value: 'IPS', label: 'Interplanetary Shock' },
    { value: 'FLR', label: 'Solar Flare' },
    { value: 'SEP', label: 'Solar Energetic Particle' },
    { value: 'MPC', label: 'Magnetopause Crossing' },
    { value: 'RBE', label: 'Radiation Belt Enhancement' },
    { value: 'HSS', label: 'High Speed Stream' },
    { value: 'WSA', label: 'WSA-Enlil Simulation' },
];

export const ipsLocations = ['ALL', 'Earth', 'MESSENGER', 'STEREO A', 'STEREO B'];
export const ipsCatalogs = ['ALL', 'SWRC_CATALOG', 'WINSLOW_MESSENGER_ICME_CATALOG'];
