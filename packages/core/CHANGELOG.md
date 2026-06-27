# @autolink/sdk

## 0.2.9

### Patch Changes

- Fix gateway double usage write, stable cache keys, GET request deduplication, browser memory cache, inquiry error details, webhook secret handling, image proxy domain lockdown

## 0.2.7

### Patch Changes

- Accept gw*pub* keys in AutolinkClient constructor validation

## 0.2.6

### Patch Changes

- Add `VehicleImage` interface and `images` field to `AutolinkVehicle` for full gallery support on detail pages

## 0.2.5

### Patch Changes

- Fix type alignment with gateway contract: InquiryType union, AutolinkProfile/Article fields, browser inquiry type forwarding, IIFE autolink.min.js output

## 0.2.4

### Patch Changes

- df1d033: Fix AutolinkProfile type to match gateway response fields

## 0.2.2

### Patch Changes

- e331b85: Fix GatewayPagination type to match actual gateway response field names: `total_pages` (was `pages`), add `has_next` and `has_previous` fields.

## 0.2.1

### Patch Changes

- 1af493e: Fix ArticleListFilters search/ordering, image proxy domain typo, add subject field to inquiry payload
