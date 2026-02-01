
export type BandType = 'BAND' | 'ELECTRONIC' | 'DJ';

export type ConnectionType = 'AMP' | 'DI' | 'PC' | 'UNKNOWN';

export type ItemType = 'VOCAL' | 'GUITAR' | 'BASE' | 'DRUM' | 'SYNTH' | 'PC' | 'OTHER';

export interface StageItem {
  id: string;
  type: ItemType;
  label: string;
  x: number;
  y: number;
  direction: 'LEFT' | 'RIGHT' | 'CENTER';
  isBrought: boolean;
  connection: ConnectionType;
}

export interface BandInfo {
  name: string;
  members: number;
  type: BandType;
}
