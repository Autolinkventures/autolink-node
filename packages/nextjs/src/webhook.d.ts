export interface WebhookHandlerConfig {
  secret?: string;
}

export declare function createWebhookHandler(
  config?: WebhookHandlerConfig
): (request: Request) => Promise<Response>;

export declare const POST: (request: Request) => Promise<Response>;
