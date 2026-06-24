// ---------------------------------------------------------------------------
// Canonical gateway response envelopes
// ---------------------------------------------------------------------------

export interface GatewayPagination {
  total: number;
  page: number;
  page_size: number;
  pages: number;
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
// Inventory
// ---------------------------------------------------------------------------

export interface VehiclePhoto {
  url: string;
  is_primary: boolean;
  caption?: string;
}

export interface AutolinkVehicle {
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price_kes: number;
  mileage_km?: number;
  condition: "new" | "used" | "certified";
  transmission?: string;
  fuel_type?: string;
  exterior_color?: string;
  interior_color?: string;
  engine?: string;
  body_type?: string;
  drive_type?: string;
  doors?: number;
  seats?: number;
  description?: string;
  photos: VehiclePhoto[];
  listing_status: "published";
  stock_status: "available" | "sold" | "reserved";
  published_at: string;
}

export interface InventoryListFilters {
  make?: string;
  model?: string;
  year?: number;
  condition?: "new" | "used" | "certified";
  min_price?: number;
  max_price?: number;
  min_mileage?: number;
  max_mileage?: number;
  transmission?: string;
  fuel_type?: string;
  body_type?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
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

export interface AutolinkArticle {
  slug: string;
  title: string;
  excerpt?: string;
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
