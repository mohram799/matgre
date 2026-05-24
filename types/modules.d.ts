declare module '@opentelemetry/sdk-trace-web' {
  export class WebTracerProvider {
    constructor(config?: any);
    addSpanProcessor(processor: any): void;
    register(): void;
    getTracer(name: string): any;
  }
}

declare module '@opentelemetry/sdk-trace-base' {
  export class SimpleSpanProcessor {
    constructor(exporter: any);
  }
  export class ConsoleSpanExporter {
    constructor();
  }
}

declare module '@opentelemetry/resources' {
  export class Resource {
    constructor(attributes: any);
  }
}

declare module '@opentelemetry/semantic-conventions' {
  export const SemanticResourceAttributes: Record<string, string>;
}

declare module 'bullmq' {
  export class Queue {
    constructor(name: string, opts?: any);
    add(name: string, data: any, opts?: any): Promise<any>;
    close(): Promise<void>;
  }
  export class Worker {
    constructor(name: string, processor: any, opts?: any);
    close(): Promise<void>;
  }
}

declare module 'ioredis' {
  import { EventEmitter } from 'events';
  export default class Redis extends EventEmitter {
    constructor(url: string, opts?: any);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<string>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    del(key: string): Promise<number>;
    quit(): Promise<string>;
  }
}
