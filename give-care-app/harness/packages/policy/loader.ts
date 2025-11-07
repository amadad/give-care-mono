import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { PolicyBundle } from './types';

const BUNDLE_DIR = fileURLToPath(new URL('./bundles', import.meta.url));

export const loadPolicyBundles = (): Record<string, PolicyBundle> => {
  const files = readdirSync(BUNDLE_DIR).filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
  return files.reduce<Record<string, PolicyBundle>>((acc, file) => {
    const raw = readFileSync(path.join(BUNDLE_DIR, file), 'utf-8');
    const parsed = parse(raw) as PolicyBundle;
    acc[parsed.name] = parsed;
    return acc;
  }, {});
};
