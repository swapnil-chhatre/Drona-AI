import { Resource } from './resource';
import { CurriculumOutcome } from './curriculum-outcome';

export interface GenerateRequest {
  grade: string;
  subject: string;
  state: string;
  topic: string;
  selected_resources: Resource[];
  curriculum_outcomes: CurriculumOutcome[];
  additional_context?: string;
  timeline_weeks?: number;
}
