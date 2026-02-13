
declare module '@google/genai' {
  export interface GenerateContentParameters {
    model: string;
    contents: any;
    config?: GenerationConfig;
  }

  export interface GenerationConfig {
    systemInstruction?: string;
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: any;
    thinkingConfig?: { thinkingBudget: number };
    tools?: any[];
    imageConfig?: {
      aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
      imageSize?: "1K" | "2K" | "4K";
    };
  }

  export interface GenerateContentResponse {
    text: string;
    candidates?: any[];
    functionCalls?: any[];
  }

  export class GoogleGenAI {
    constructor(config: { apiKey: string });
    models: {
      generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse>;
      generateContentStream(params: GenerateContentParameters): AsyncIterable<GenerateContentResponse>;
    };
  }

  export enum Modality {
    AUDIO = 'AUDIO',
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
  }

  export enum Type {
    TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    INTEGER = 'INTEGER',
    BOOLEAN = 'BOOLEAN',
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
    NULL = 'NULL',
  }
}
