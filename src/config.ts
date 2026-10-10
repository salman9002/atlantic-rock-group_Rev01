/**
 * Atlantic Rock Group Decal Studio - central configuration.
 * Every external URL and limit used by the app lives here.
 */
export const CONFIG = {
  // >>> REPLACE THIS with the final public quote-request URL when it exists. <<<
  QUOTE_URL: 'https://atlanticrockgroup.com',
  SITE_URL: 'https://atlanticrockgroup.com',
  COMPANY_NAME: 'Atlantic Rock Group',
  REGION: 'Newfoundland',

  // Uploads
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024,
  ACCEPTED_TYPES: ['image/svg+xml', 'image/png', 'image/jpeg'] as string[],
  ACCEPT_ATTR: '.svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg',

  // Design size limits (cm)
  MIN_CM: 2,
  MAX_CM: 300,
  DEFAULT_WIDTH_CM: 60,
  DEFAULT_HEIGHT_CM: 20,

  // Raster export: longest side in pixels
  PNG_MAX_PX: 3000,
  HISTORY_LIMIT: 100,
};
