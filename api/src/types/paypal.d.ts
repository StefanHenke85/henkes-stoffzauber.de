declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    class PayPalHttpClient {
      constructor(environment: SandboxEnvironment | LiveEnvironment);
      execute<T>(request: unknown): Promise<{ result: T; statusCode: number }>;
    }

    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }

  export namespace orders {
    class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: unknown): void;
    }

    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: unknown): void;
    }

    class OrdersGetRequest {
      constructor(orderId: string);
    }
  }

  export namespace payments {
    class CapturesRefundRequest {
      constructor(captureId: string);
      requestBody(body: unknown): void;
    }
  }
}
