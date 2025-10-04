import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

export interface KaiConfig {
  projectsDir: string;
  recentDirs: RecentDirectory[];
  maxRecents: number;
}

export interface RecentDirectory {
  path: string;
  accessedAt: number;
  name: string;
}

const CONFIG_DIR = join(homedir(), '.config', 'kai');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: KaiConfig = {
  projectsDir: join(homedir(), 'Documents', 'kirana_labs', 'projects'),
  recentDirs: [],
  maxRecents: 10,
};

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): KaiConfig {
  ensureConfigDir();
  
  if (!existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.warn('Failed to load config, using defaults');
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: KaiConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function addRecentDirectory(path: string, name: string): void {
  const config = loadConfig();
  
  // Remove if already exists
  config.recentDirs = config.recentDirs.filter(d => d.path !== path);
  
  // Add to front
  config.recentDirs.unshift({
    path,
    name,
    accessedAt: Date.now(),
  });
  
  // Limit to maxRecents
  config.recentDirs = config.recentDirs.slice(0, config.maxRecents);
  
  saveConfig(config);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
