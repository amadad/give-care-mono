/**
 * Shared Type Definitions
 *
 * Application-wide interfaces and types
 */

// Agent Context Types
export interface AgentContext {
  userId: string;
  sessionId?: string;
  locale: string;
  consent: {
    emergency: boolean;
    marketing: boolean;
  };
  crisisFlags?: {
    active: boolean;
    terms: string[];
  };
  metadata?: AgentMetadata;
}

export interface AgentMetadata {
  profile?: UserProfile;
  journeyPhase?: string;
  totalInteractionCount?: number;
  enrichedContext?: string;
  contextUpdatedAt?: number;
  [key: string]: unknown;
}

// Profile Types
export interface UserProfile {
  firstName?: string;
  relationship?: string;
  careRecipientName?: string;
  zipCode?: string; // ZIP code for finding local resources (contextually collected)
  [key: string]: unknown;
}

// Maps Grounding Types
export interface MapsGroundingChunk {
  maps?: MapsData;
  [key: string]: unknown;
}

export interface MapsData {
  title?: string;
  formattedAddress?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  rating?: number;
  nationalPhoneNumber?: string;
  id?: string;
  googleMapsUri?: string;
  [key: string]: unknown;
}

export interface MapsGroundingMetadata {
  groundingChunks?: MapsGroundingChunk[];
  [key: string]: unknown;
}

export interface ResourceResult {
  name: string;
  address: string;
  hours?: string;
  rating?: number;
  phone?: string;
  category: string;
  placeId?: string;
  uri?: string;
}

// Tool Context Types
// Agent Component tools receive a context with metadata at runtime
// This type extends the base context with the runtime metadata property
export interface AgentToolContext {
  userId: string;
  metadata?: {
    context?: {
      metadata?: AgentMetadata;
    };
  };
}
