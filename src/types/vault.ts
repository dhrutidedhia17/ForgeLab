export interface VaultEntry {
  id: string;
  title: string;
  prompt: string;
  category: string;
  createdAt: string;
  status: 'complete' | 'partial' | 'error';
  tags: string[];
  materials: string[];
  outputs: {
    guide?: string;
    vendors?: string;
    model3d?: string;
    blueprint?: string;
    image?: string;
    video?: string[];
    music?: string;
  };
  relatedBuilds: { id: string; title: string }[];
}

export interface VaultIndex {
  builds: VaultEntry[];
}
