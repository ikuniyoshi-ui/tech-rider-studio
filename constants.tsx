
import React from 'react';
import { ItemType, StageItem, ConnectionType } from './types';

export const ITEM_DEFAULTS: Record<ItemType, { icon: string; label: string; connection: ConnectionType }> = {
  VOCAL: { icon: '🎤', label: 'ボーカル', connection: 'UNKNOWN' },
  GUITAR: { icon: '🎸', label: 'ギター', connection: 'AMP' },
  BASE: { icon: '🎸', label: 'ベース', connection: 'AMP' },
  DRUM: { icon: '🥁', label: 'ドラム', connection: 'UNKNOWN' },
  SYNTH: { icon: '🎹', label: 'シンセ', connection: 'DI' },
  PC: { icon: '💻', label: 'PC', connection: 'DI' },
  OTHER: { icon: '📦', label: 'その他', connection: 'UNKNOWN' },
};

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  AMP: 'アンプ',
  DI: 'DI (ライン出力)',
  PC: 'PC直結',
  UNKNOWN: 'わからない (お任せ)',
};
