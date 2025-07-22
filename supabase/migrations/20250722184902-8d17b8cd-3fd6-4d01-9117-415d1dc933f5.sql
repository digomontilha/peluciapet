-- First drop the existing foreign key constraint
ALTER TABLE product_prices 
DROP CONSTRAINT IF EXISTS product_prices_product_size_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE product_prices
ADD CONSTRAINT product_prices_product_size_id_fkey
FOREIGN KEY (product_size_id)
REFERENCES product_sizes(id)
ON DELETE CASCADE;

-- Also ensure the product_id foreign key has cascade delete
ALTER TABLE product_prices 
DROP CONSTRAINT IF EXISTS product_prices_product_id_fkey;

ALTER TABLE product_prices
ADD CONSTRAINT product_prices_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE;