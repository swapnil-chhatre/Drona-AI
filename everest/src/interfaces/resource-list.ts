import { Resource } from './resource';

export interface ResourceList {
  resources: Resource[];
  search_queries_used: string[];
  total_found: number;
}
