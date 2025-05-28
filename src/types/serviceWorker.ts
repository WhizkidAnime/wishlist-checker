// Service Worker API Types
export interface ServiceWorkerRegistration {
  installing?: ServiceWorker;
  waiting?: ServiceWorker;
  active?: ServiceWorker;
  scope: string;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface ServiceWorker {
  scriptURL: string;
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';
  postMessage(message: any): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface ServiceWorkerContainer {
  controller?: ServiceWorker;
  ready: Promise<ServiceWorkerRegistration>;
  register(scriptURL: string, options?: ServiceWorkerRegistrationOptions): Promise<ServiceWorkerRegistration>;
  getRegistration(scope?: string): Promise<ServiceWorkerRegistration | undefined>;
  getRegistrations(): Promise<ServiceWorkerRegistration[]>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface ServiceWorkerRegistrationOptions {
  scope?: string;
  type?: 'classic' | 'module';
  updateViaCache?: 'imports' | 'all' | 'none';
}

// Cache API Types
export interface Cache {
  add(request: RequestInfo): Promise<void>;
  addAll(requests: RequestInfo[]): Promise<void>;
  delete(request: RequestInfo, options?: CacheQueryOptions): Promise<boolean>;
  keys(request?: RequestInfo, options?: CacheQueryOptions): Promise<Request[]>;
  match(request: RequestInfo, options?: CacheQueryOptions): Promise<Response | undefined>;
  matchAll(request?: RequestInfo, options?: CacheQueryOptions): Promise<Response[]>;
  put(request: RequestInfo, response: Response): Promise<void>;
}

export interface CacheStorage {
  delete(cacheName: string): Promise<boolean>;
  has(cacheName: string): Promise<boolean>;
  keys(): Promise<string[]>;
  match(request: RequestInfo, options?: MultiCacheQueryOptions): Promise<Response | undefined>;
  open(cacheName: string): Promise<Cache>;
}

export interface CacheQueryOptions {
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
  ignoreVary?: boolean;
  cacheName?: string;
}

export interface MultiCacheQueryOptions extends CacheQueryOptions {
  cacheName?: string;
}

// Notification API Types
export interface NotificationOptions {
  actions?: NotificationAction[];
  badge?: string;
  body?: string;
  data?: any;
  dir?: 'auto' | 'ltr' | 'rtl';
  icon?: string;
  image?: string;
  lang?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  timestamp?: number;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Custom Service Worker Message Types
export interface ServiceWorkerMessage {
  type: 'SW_UPDATE_AVAILABLE' | 'SW_READY' | 'SW_CACHED' | 'SW_ERROR';
  payload?: any;
}

export interface ServiceWorkerUpdateEvent extends Event {
  type: 'updatefound';
}

export interface ServiceWorkerStateChangeEvent extends Event {
  type: 'statechange';
  target: ServiceWorker & EventTarget;
} 