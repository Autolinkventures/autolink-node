// ---------------------------------------------------------------------------
// Canonical gateway response envelopes
// ---------------------------------------------------------------------------

export interface GatewayPagination {
  total: number;
  page: number;
  page_size: number;
  /** Total number of pages. The gateway field name is `total_pages`. */
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GatewayMeta {
  request_id: string;
  pagination?: GatewayPagination;
}

export interface GatewayEnvelope<T> {
  data: T;
  meta: GatewayMeta;
}

// ---------------------------------------------------------------------------
// Enums — mirrors Django TextChoices from Autolink Backend
// ---------------------------------------------------------------------------

export type StockStatus = "available" | "reserved" | "sold" | "in_transit";
export type VehicleCondition = "new" | "locally_used" | "foreign_used";

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/** @deprecated Use cover_image / cover_image_variants instead */
export interface VehiclePhoto {
  url: string;
  is_primary: boolean;
  caption?: string;
}

export interface CoverImageVariants {
  thumb: string;
  medium: string;
  large: string;
  master: string;
}

export interface VehicleDealer {
  name: string;
  slug: string;
  logo?: string;
  city?: string;
  whatsapp_number?: string;
  public_url?: string;
}

export interface AutolinkVehicle {
  /** UUID — internal identifier */
  id: string;
  /** URL-safe slug — use this for routes and API calls */
  slug: string;
  title: string;
  make: string;
  make_id?: string;
  model: string;
  model_id?: string;
  year: number;
  body_type: string;
  body_type_display?: string;
  colour?: string;
  condition: VehicleCondition;
  mileage_km?: number;
  engine_size?: number;
  fuel_type?: string;
  fuel_type_display?: string;
  transmission?: string;
  transmission_display?: string;
  drive_type?: string;
  price_kes: number;
  is_negotiable?: boolean;
  has_discount?: boolean;
  active_discount_price_kes?: number | null;
  location?: string;
  stock_status: StockStatus;
  stock_status_display?: string;
  is_featured?: boolean;
  description?: string;
  features?: string[];
  /** Primary image URL */
  cover_image?: string;
  cover_image_variants?: CoverImageVariants;
  /** @deprecated Use cover_image instead */
  photos?: VehiclePhoto[];
  listing_status?: "published";
  published_at: string;
  dealer?: VehicleDealer;
  salesperson?: unknown;
}

export interface InventoryListFilters {
  make?: string;
  model?: string;
  year?: number;
  min_year?: number;
  max_year?: number;
  condition?: VehicleCondition;
  stock_status?: StockStatus;
  min_price?: number;
  max_price?: number;
  min_mileage?: number;
  max_mileage?: number;
  transmission?: string;
  fuel_type?: string;
  body_type?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  feature_ids?: string;
}

export interface FilterOptions {
  makes: string[];
  models: string[];
  years: number[];
  conditions: string[];
  transmissions: string[];
  fuel_types: string[];
  body_types: string[];
  stock_statuses?: string[];
  colours?: string[];
  price_range: { min: number; max: number };
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

export interface AutolinkInquiryPayload {
  type: "vehicle" | "general";
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  subject?: string;
  message: string;
  vehicle_slug?: string;
}

export interface AutolinkInquiry {
  id: string;
  type: string;
  customer_name: string;
  customer_email: string;
  message: string;
  vehicle_slug?: string;
  lead_id?: string;
  test_mode: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface AutolinkProfile {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  cover_url?: string;
  is_publicly_visible: boolean;
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface ArticleListFilters {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface AutolinkArticle {
  slug: string;
  title: string;
  excerpt?: string;
  /** Raw HTML from the CMS — sanitize before rendering */
  body: string;
  cover_image_url?: string;
  status: "published";
  published_at: string;
  author?: string;
}

// ---------------------------------------------------------------------------
// Integration health
// ---------------------------------------------------------------------------

export interface IntegrationStatus {
  ok: boolean;
  environment: "test" | "live";
  tenant: { slug: string; name: string };
  scopes: string[];
  api_version: string;
}
