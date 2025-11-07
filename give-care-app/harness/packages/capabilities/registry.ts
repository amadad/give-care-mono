import { CapabilityDefinition, CapabilityRegistry } from '../shared/types';
import { updateProfile } from './profile.update';
import { scoreAssessment } from './assessment.score';
import { suggestInterventions } from './interventions.suggest';
import { scheduleFollowUp } from './schedule.followup';
import { scheduleTrigger } from './schedule.trigger';
import { searchResources } from './resources.search';
import { startAssessmentCapability } from './assessment.start';
import { recordAssessmentAnswerCapability } from './assessment.recordAnswer';
import { getWellnessStatus } from './wellness.status';
import { recordMemoryCapability } from './memory.record';
import { processAlertsCapability } from './alerts.process';
import { sendEmailCapability } from './notifications.email';
import { refreshEntitlementsCapability } from './billing.refresh';
import { fetchAdminMetricsCapability } from './admin.metrics';

const capabilities: CapabilityDefinition<any, any>[] = [
  updateProfile,
  scoreAssessment,
  suggestInterventions,
  scheduleFollowUp,
  scheduleTrigger,
  searchResources,
  startAssessmentCapability,
  recordAssessmentAnswerCapability,
  getWellnessStatus,
  recordMemoryCapability,
  processAlertsCapability,
  sendEmailCapability,
  refreshEntitlementsCapability,
  fetchAdminMetricsCapability,
];

export const capabilityRegistry: CapabilityRegistry = {
  get(name: string) {
    return capabilities.find((c) => c.name === name);
  },
  list() {
    return [...capabilities];
  },
};
