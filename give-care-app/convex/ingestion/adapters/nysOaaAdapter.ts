/**
 * NYS Office for the Aging (OAA) Adapter
 *
 * Source-specific parsing logic ONLY (50-100 lines).
 * All normalization/loading is handled by shared functions.
 */

import { IntermediateRecord } from "../shared/types";

/**
 * Parse NYS OAA text format into intermediate format
 *
 * Input: Semi-structured text (see source/food.md)
 * Output: Array of IntermediateRecord
 */
export function parseNysOaa(fileContent: string): IntermediateRecord[] {
  const records: IntermediateRecord[] = [];
  const sections = fileContent.split(/\n\n+/);

  let currentRecord: Partial<IntermediateRecord> = {};

  for (const section of sections) {
    const lines = section.trim().split('\n');

    // First line is title (unless it's a field label)
    if (lines[0] && !lines[0].includes(':')) {
      // Save previous record
      if (currentRecord.title && currentRecord.providerName) {
        records.push(currentRecord as IntermediateRecord);
      }

      // Start new record
      currentRecord = { title: lines[0].trim(), description: '' };

      // Description lines (until we hit field labels)
      const descLines: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes(':')) break;
        descLines.push(lines[i].trim());
      }
      currentRecord.description = descLines.join(' ').trim();
    }

    // Parse field labels
    for (const line of lines) {
      if (line.includes('Provider:')) {
        currentRecord.providerName = line.split('Provider:')[1]?.trim() || '';
      } else if (line.includes('Address:')) {
        currentRecord.address = line.split('Address:')[1]?.trim();
      } else if (line.includes('Telephone:')) {
        currentRecord.phone = line.split('Telephone:')[1]?.trim();
      } else if (line.includes('Email:')) {
        currentRecord.email = line.split('Email:')[1]?.trim();
      } else if (line.includes('Website:')) {
        currentRecord.website = line.split('Website:')[1]?.trim();
      }
    }
  }

  // Save last record
  if (currentRecord.title && currentRecord.providerName) {
    records.push(currentRecord as IntermediateRecord);
  }

  return records;
}
