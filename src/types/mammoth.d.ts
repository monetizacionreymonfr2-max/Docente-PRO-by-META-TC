declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface InputOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(input: InputOptions): Promise<MammothResult>;
  export function convertToHtml(input: InputOptions): Promise<MammothResult>;
}
