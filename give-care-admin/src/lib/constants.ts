import { Activity, CheckCircle2, XCircle, AlertTriangle, LucideIcon } from 'lucide-react'

export interface WorkflowStatusVariant {
  label: string
  className: string
  icon: LucideIcon
}

export const WORKFLOW_STATUS_VARIANTS: Record<string, WorkflowStatusVariant> = {
  running: {
    label: 'Running',
    className: 'bg-blue-500/10 text-blue-500',
    icon: Activity
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-500',
    icon: CheckCircle2
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-500',
    icon: XCircle
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-500/10 text-yellow-500',
    icon: AlertTriangle
  }
}

export function getWorkflowStatusVariant(status: string): WorkflowStatusVariant {
  return WORKFLOW_STATUS_VARIANTS[status] || WORKFLOW_STATUS_VARIANTS.paused
}

export interface USState {
  code: string
  name: string
}

export const US_STATES: USState[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
]

export interface ServiceType {
  value: string
  label: string
}

export const SERVICE_TYPES: ServiceType[] = [
  { value: 'respite_care', label: 'Respite Care' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'support_groups', label: 'Support Groups' },
  { value: 'financial_assistance', label: 'Financial Assistance' },
  { value: 'legal_assistance', label: 'Legal Assistance' },
  { value: 'home_care', label: 'Home Care' },
  { value: 'adult_day_care', label: 'Adult Day Care' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'meal_delivery', label: 'Meal Delivery' },
  { value: 'medical_equipment', label: 'Medical Equipment' },
  { value: 'education_training', label: 'Education & Training' },
  { value: 'hospice_care', label: 'Hospice Care' }
]
