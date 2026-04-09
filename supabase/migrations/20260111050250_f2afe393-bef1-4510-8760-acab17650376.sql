-- Create a table for favorite quotes
CREATE TABLE public.favorite_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favorite_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorite quotes" 
ON public.favorite_quotes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save favorite quotes" 
ON public.favorite_quotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorite quotes" 
ON public.favorite_quotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_favorite_quotes_user_id ON public.favorite_quotes(user_id);