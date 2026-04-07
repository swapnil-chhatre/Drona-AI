import { Resource } from './resource';
import { CurriculumOutcome } from './curriculum-outcome';

export interface ResourceList {
  resources: Resource[];
  curriculum_outcomes: CurriculumOutcome[];
  search_queries_used: string[];
  total_found: number;
  ai_recommendation: string;
}
