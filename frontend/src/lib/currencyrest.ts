/**
 * CurrencyRest API Client (TypeScript)
 * Spec: https://currencyrest.com/llms.txt
 * Documentation: https://currencyrest.com/docs
 */

export interface CurrencyRestConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface ConvertRequest {
  from: string;
  to: string;
  amount: number;
  source?: string;
}

export interface ConvertResponse {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  source: string;
  timestamp: string;
}

export interface RatesResponse {
  base: string;
  source: string;
  timestamp: string;
  counts: {
    fiat: number;
    crypto: number;
    total: number;
  };
  rates: {
    fiat: Record<string, number>;
    crypto: Record<string, number>;
  };
}

export interface PairRateResponse {
  from: string;
  to: string;
  rate: number;
  source: string;
  timestamp: string;
}

export interface SourcesResponse {
  from: string;
  to: string;
  sources: string[];
}

export interface HistoricalRateItem {
  date: string;
  rate: number;
  source: string;
}

export interface HistoricalResponse {
  from: string;
  to: string;
  source: string;
  rates: HistoricalRateItem[];
}

export interface SourceStatus {
  source: string;
  type: "fiat" | "crypto";
  status: "operational" | "degraded" | "outage";
  latencyMs?: number;
}

export interface StatusResponse {
  sources: SourceStatus[];
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface CurrencyRestError {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
}

export class CurrencyRestClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config?: CurrencyRestConfig) {
    this.apiKey =
      config?.apiKey ||
      process.env.NEXT_PUBLIC_CURRENCYREST_API_KEY ||
      process.env.CURRENCYREST_API_KEY ||
      "cs_live_623ea5baad014dae81bbaabff342569e";
    this.baseUrl = (config?.baseUrl || "https://api.currencyrest.com/api/v1").replace(/\/$/, "");
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: CurrencyRestError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          title: response.statusText,
          detail: `HTTP error ${response.status}: ${response.statusText}`,
        };
      }
      const err = new Error(errorData.detail || errorData.title || `CurrencyRest Error (${response.status})`);
      (err as unknown as { response: CurrencyRestError }).response = errorData;
      throw err;
    }

    return response.json();
  }

  /**
   * Convert an amount between two currencies (fiat or crypto).
   * GET /api/v1/convert?from=USD&to=EUR&amount=100
   */
  async convert(params: ConvertRequest): Promise<ConvertResponse> {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
      amount: String(params.amount),
    });
    if (params.source) {
      query.set("source", params.source);
    }
    return this.request<ConvertResponse>(`/convert?${query.toString()}`);
  }

  /**
   * Convert an amount using POST method.
   * POST /api/v1/convert
   */
  async convertPost(params: ConvertRequest): Promise<ConvertResponse> {
    return this.request<ConvertResponse>("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  }

  /**
   * Get all current rates for a base currency.
   * GET /api/v1/rates?base=USD
   */
  async getRates(params?: { base?: string; source?: string }): Promise<RatesResponse> {
    const query = new URLSearchParams();
    if (params?.base) query.set("base", params.base);
    if (params?.source) query.set("source", params.source);
    const qs = query.toString();
    return this.request<RatesResponse>(`/rates${qs ? `?${qs}` : ""}`);
  }

  /**
   * Get rate for a single currency pair.
   * GET /api/v1/rates/pair?from=USD&to=EUR
   */
  async getPairRate(params: { from: string; to: string; source?: string }): Promise<PairRateResponse> {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    if (params.source) query.set("source", params.source);
    return this.request<PairRateResponse>(`/rates/pair?${query.toString()}`);
  }

  /**
   * List sources currently quoting a pair.
   * GET /api/v1/rates/sources?from=USD&to=EUR
   */
  async getSources(params: { from: string; to: string }): Promise<SourcesResponse> {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    return this.request<SourcesResponse>(`/rates/sources?${query.toString()}`);
  }

  /**
   * Get historical rate series.
   * GET /api/v1/historical
   */
  async getHistorical(params: {
    from: string;
    to: string;
    startDate?: string;
    endDate?: string;
    source?: string;
    limit?: number;
  }): Promise<HistoricalResponse> {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.source) query.set("source", params.source);
    if (params.limit) query.set("limit", String(params.limit));
    return this.request<HistoricalResponse>(`/historical?${query.toString()}`);
  }

  /**
   * Get per-source operational status.
   * GET /api/v1/status
   */
  async getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>("/status");
  }

  /**
   * Health probe.
   * GET /api/v1/health
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }
}

// Singleton default client export
export const currencyRest = new CurrencyRestClient();
export default currencyRest;
