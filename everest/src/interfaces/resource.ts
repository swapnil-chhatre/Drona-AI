export interface Resource {
  title: string;
  // Use '?' for optional fields or 'null' for explicit nullability
  url?: string | null; 
  summary: string;
  
  // TypeScript "String Literal Types" replace Python's Literal
  source_type: 'web' | 'teacher_upload';
  curriculum_alignment: 'high' | 'medium' | 'low';
  bias_risk: 'low' | 'medium' | 'flag';
  
  reading_level: string;
  domain?: string | null;
  
  // Use 'string[]' for list[str]
  follow_up_questions: string[];
  document_id?: string | null;
}