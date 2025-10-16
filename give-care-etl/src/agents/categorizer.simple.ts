"use node";

/**
 * Categorizer Agent
 *
 * Maps service types to pressure zones using the SERVICE_TO_ZONES mapping
 * from give-care-app taxonomy
 */

import { IntermediateRecord, CategorizedRecord } from "../shared/types";
import { SERVICE_TO_ZONES } from "../shared/taxonomy";
import { createLogger } from "../utils/logger";

const logger = createLogger({ agentName: "categorizer" });

/**
 * Categorize a record by mapping service types to pressure zones
 */
export function categorizeRecord(record: IntermediateRecord): CategorizedRecord {
  const zones = new Set<string>();
  let matchedServices = 0;

  // Map each service type to its pressure zones
  for (const serviceType of record.serviceTypes) {
    const serviceZones = SERVICE_TO_ZONES[serviceType];
    if (serviceZones) {
      serviceZones.forEach(zone => zones.add(zone));
      matchedServices++;
    } else {
      logger.warn("Unknown service type", { serviceType, record: record.title });
    }
  }

  // Calculate confidence based on how many services we successfully mapped
  const categoryConfidence = record.serviceTypes.length > 0
    ? Math.round((matchedServices / record.serviceTypes.length) * 100)
    : 0;

  const categorized: CategorizedRecord = {
    ...record,
    zones: Array.from(zones),
    categoryConfidence
  };

  logger.info("Categorized record", {
    title: record.title,
    serviceTypes: record.serviceTypes,
    zones: categorized.zones,
    confidence: categoryConfidence
  });

  return categorized;
}

/**
 * Batch categorize multiple records
 */
export function categorizeRecords(records: IntermediateRecord[]): CategorizedRecord[] {
  return records.map(categorizeRecord);
}
