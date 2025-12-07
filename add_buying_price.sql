-- Add missing buying_price column to products table
ALTER TABLE public.products 
ADD COLUMN buying_price numeric default 0;
