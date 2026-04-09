-- Add theme preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme_preference text DEFAULT 'light',
ADD COLUMN color_theme text DEFAULT 'teal';