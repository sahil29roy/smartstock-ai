CREATE TABLE challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_number VARCHAR(50) UNIQUE NOT NULL,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
  dispatch_date TIMESTAMPTZ,
  carrier_details TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE challan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_challans_sale_id ON challans(sale_id);
CREATE INDEX idx_challans_status ON challans(status);
CREATE INDEX idx_challans_number ON challans(challan_number);
CREATE INDEX idx_challan_items_challan_id ON challan_items(challan_id);
CREATE INDEX idx_challan_items_product_id ON challan_items(product_id);
