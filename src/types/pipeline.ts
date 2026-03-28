export type StepName =
  | 'research'
  | 'vendors'
  | 'model3d'
  | 'blueprint'
  | 'image'
  | 'video';

export type StepStatus = 'pending' | 'running' | 'complete' | 'error';

export interface StepInfo {
  name: StepName;
  label: string;
  description: string;
  icon: string;
}

export const PIPELINE_STEPS: StepInfo[] = [
  { name: 'research', label: 'Research & Guide', description: 'Generating build guide with AI research', icon: 'BookOpen' },
  { name: 'vendors', label: 'Materials & Vendors', description: 'Finding suppliers and pricing', icon: 'ShoppingCart' },
  { name: 'model3d', label: '3D Model', description: 'Creating 3D CAD model', icon: 'Box' },
  { name: 'blueprint', label: 'Blueprint', description: 'Generating 2D fabrication drawing', icon: 'Ruler' },
  { name: 'image', label: 'Product Image', description: 'Rendering photorealistic image', icon: 'Image' },
  { name: 'video', label: 'Tutorial Video', description: 'Creating narrated video with background music', icon: 'Video' },
];

export interface StepResult {
  step: StepName;
  status: StepStatus;
  result?: ResearchResult | VendorResult | Model3DResult | BlueprintResult | ImageResult | VideoResult;
  error?: string;
  isMock?: boolean;
}

export interface ResearchResult {
  title: string;
  overview: string;
  materials: MaterialItem[];
  tools: string[];
  steps: BuildStep[];
  safetyNotes: string[];
  estimatedTime: string;
  difficulty: string;
  rawGuide: string;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  specification: string;
}

export interface BuildStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface VendorResult {
  vendors: VendorEntry[];
}

export interface VendorEntry {
  material: string;
  suppliers: {
    name: string;
    url: string;
    priceRange: string;
  }[];
}

export interface Model3DResult {
  filePath: string;
  fileName: string;
  format: string;
  sceneData?: Model3DSceneData;
  views?: Model3DView[];
}

export interface Model3DView {
  angle: string;
  filePath: string;
  fileName: string;
}

export interface Model3DSceneData {
  shapes: Model3DShape[];
  dimensions?: { width: number; height: number; depth: number };
}

export interface Model3DShape {
  type: "box" | "cylinder" | "sphere" | "plane" | "cone" | "torus";
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  label?: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}

export interface BlueprintResult {
  filePath: string;
  fileName: string;
  format: string;
  svgContent?: string;
}

export interface ImageResult {
  filePath: string;
  fileName: string;
}

export interface VideoResult {
  clips: {
    filePath: string;
    fileName: string;
    description: string;
  }[];
  music?: {
    filePath: string;
    fileName: string;
    duration: string;
  };
}

export interface PipelineRequest {
  prompt: string;
  pdfBase64?: string;
  imageBase64?: string;
  imageMimeType?: string;
  category: string;
}

export interface PipelineState {
  buildId: string;
  prompt: string;
  category: string;
  steps: Record<StepName, StepResult>;
  status: 'idle' | 'running' | 'complete' | 'error';
}

export type SSEEvent = {
  event: 'step' | 'pipeline' | 'heartbeat';
  data: StepResult | { status: string; buildId?: string; error?: string } | { ping: true };
};

export const CATEGORIES = [
  'Furniture',
  'Clothing',
  'Appliance',
  'Electronics',
  'Vehicle',
  'House',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];
