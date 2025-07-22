-- Adicionar controle de estoque para cada imagem do produto
ALTER TABLE product_images 
ADD COLUMN stock_quantity INTEGER DEFAULT 0,
ADD COLUMN is_available BOOLEAN DEFAULT true;

-- Atualizar imagens existentes com estoque padrão
UPDATE product_images 
SET stock_quantity = 5, is_available = true 
WHERE stock_quantity IS NULL;