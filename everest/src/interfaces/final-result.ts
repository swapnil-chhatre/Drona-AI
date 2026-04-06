export interface FinalResultChunk {
  id: string;
  title: string;
  icon: string;
  accent: 'primary' | 'tertiary';
  markdown: string;
}

export interface FinalResultTab {
  label: string;
  active?: boolean;
}

export interface FinalResultAction {
  label: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
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
  tabs: FinalResultTab[];
  chunks: FinalResultChunk[];
  actions: FinalResultAction[];
  exports: FinalResultExportOption[];
}
