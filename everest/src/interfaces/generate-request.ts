import { Resource } from './resource';

export interface GenerateRequest {
  grade: string;
  subject: string;
  state: string;
  topic: string;
  selected_resources: Resource[];
  additional_context?: string;
  timeline_weeks?: number;
}
