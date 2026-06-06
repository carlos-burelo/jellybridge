import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Destination {
  id: string;
  name: string;
  path: string;
}

export interface Settings {
  passwords: string[];
  destinations: Destination[];
  tempDir: string;
}

const SETTINGS_PATH = join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: Settings = {
  passwords: [],
  destinations: [],
  tempDir: '/tmp/jellybridge',
};

export function loadSettings(): Settings {
  if (!existsSync(SETTINGS_PATH)) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}
