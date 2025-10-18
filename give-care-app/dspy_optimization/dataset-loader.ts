/**
 * Load and parse evaluation dataset from JSONL file
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EvalExample } from './types';

export class DatasetLoader {
  private examples: EvalExample[] = [];

  constructor(private datasetPath: string) {}

  /**
   * Load dataset from JSONL file
   */
  load(): EvalExample[] {
    const filePath = resolve(this.datasetPath);
    const content = readFileSync(filePath, 'utf-8');

    // Parse JSONL (one JSON object per line)
    this.examples = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as EvalExample);

    console.log(`✅ Loaded ${this.examples.length} examples from ${this.datasetPath}`);
    return this.examples;
  }

  /**
   * Get all examples
   */
  getAll(): EvalExample[] {
    return this.examples;
  }

  /**
   * Filter examples by category
   */
  getByCategory(category: string): EvalExample[] {
    return this.examples.filter(
      ex => ex.info.labels.category === category
    );
  }

  /**
   * Filter examples by trauma principle
   */
  getByPrinciple(principle: string): EvalExample[] {
    return this.examples.filter(
      ex => ex.info.labels.trauma_principles.includes(principle)
    );
  }

  /**
   * Sample N random examples
   */
  sample(n: number): EvalExample[] {
    const shuffled = [...this.examples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  }

  /**
   * Split into train/test sets
   */
  split(trainRatio: number = 0.8): {
    train: EvalExample[];
    test: EvalExample[];
  } {
    const shuffled = [...this.examples].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * trainRatio);

    return {
      train: shuffled.slice(0, splitIndex),
      test: shuffled.slice(splitIndex),
    };
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    total: number;
    categories: Record<string, number>;
    principles: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    const principles: Record<string, number> = {};

    for (const ex of this.examples) {
      // Count categories
      const cat = ex.info.labels.category;
      categories[cat] = (categories[cat] || 0) + 1;

      // Count principles
      for (const principle of ex.info.labels.trauma_principles) {
        principles[principle] = (principles[principle] || 0) + 1;
      }
    }

    return {
      total: this.examples.length,
      categories,
      principles,
    };
  }
}
