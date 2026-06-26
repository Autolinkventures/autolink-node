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
  year_min?: number;
  year_max?: number;
  condition?: VehicleCondition;
  stock_status?: StockStatus;
  price_min?: number;
  price_max?: number;
  mileage_max?: number;
  transmission?: string;
  fuel_type?: string;
  body_type?: string;
  q?: string;
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

export type InquiryType = "vehicle" | "general" | "finance" | "import" | "service";

export interface AutolinkInquiryPayload {
  type?: InquiryType;
  customer_name: string;
  /** Required when customer_phone is not provided. */
  customer_email?: string;
  /** Required when customer_email is not provided. */
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
  about?: string;
  logo?: string | null;
  banner?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  website_url?: string;
  address?: string;
  city?: string;
  county?: string;
  county_display?: string;
  google_maps_url?: string;
  latitude?: number | null;
  longitude?: number | null;
  established_year?: number | null;
  has_location?: boolean;
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface ArticleListFilters {
  page?: number;
  page_size?: number;
  q?: string;
  ordering?: string;
  category?: string;
  featured?: boolean;
}

export interface AutolinkArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  /** Categories defined by the dealer CMS. */
  category?: string;
  tags?: string[];
  /** Absolute URL to the cover image. */
  cover_image?: string | null;
  author_name?: string;
  author_avatar?: string | null;
  is_featured?: boolean;
  published_at: string;
  updated_at?: string;
  /** Only present on detail responses. Raw HTML — sanitize before rendering. */
  body?: string;
  meta_title?: string;
  meta_description?: string;
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
