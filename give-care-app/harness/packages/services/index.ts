import * as assessment from './assessment';
import * as scheduling from './scheduling';
import * as interventions from './interventions';
import * as billing from './billing';
import * as memory from './memory';
import * as resources from './resources';
import * as email from './email';

export const services = {
  assessment,
  scheduling,
  interventions,
  billing,
  memory,
  resources,
  email,
};

export type Services = typeof services;
