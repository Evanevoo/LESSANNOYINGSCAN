ALTER TABLE imported_invoices ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'SASKATOON';
ALTER TABLE imported_sales_receipts ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'SASKATOON';
UPDATE imported_invoices SET location = 'SASKATOON' WHERE location IS NULL OR location = '';
UPDATE imported_sales_receipts SET location = 'SASKATOON' WHERE location IS NULL OR location = '';
