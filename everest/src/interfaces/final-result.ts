export interface FinalResultDocument {
  id: string;
  label: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
  markdown: string;
}

export interface FinalResultExportOption {
  label: string;
  icon: string;
  actionIcon: string;
}

export interface FinalResultResponse {
  eyebrow: string;
  title: string;
  createdAt: string;
  duration: string;
  level: string;
  documents: FinalResultDocument[];
  exports: FinalResultExportOption[];
}
