export interface Resource {
  title: string;
  url?: string | null;
  summary: string;
  source_type: 'web' | 'teacher_upload';
  curriculum_alignment: 'high' | 'medium' | 'low';
  bias_risk: 'low' | 'medium' | 'flag';
  reading_level: string;
  domain?: string | null;
  follow_up_questions: string[];
  document_id?: string | null;
}
