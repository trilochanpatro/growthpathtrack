import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Trash2, Quote } from "lucide-react";

interface FavoriteQuote {
  id: string;
  quote: string;
  author: string;
  interest: string;
  created_at: string;
}

interface FavoriteQuotesDialogProps {
  trigger?: React.ReactNode;
}

export function FavoriteQuotesDialog({ trigger }: FavoriteQuotesDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<FavoriteQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchFavorites = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorite_quotes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("favorite_quotes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      toast({ title: "Quote removed", description: "Removed from favorites" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove quote", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <Heart className="w-4 h-4" />
            Favorites
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Favorite Quotes
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <Quote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No favorite quotes yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the heart icon on quotes to save them here
              </p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="glass-card rounded-xl p-4 border border-border/50 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary mb-1">{q.interest}</p>
                      <blockquote className="text-foreground leading-relaxed mb-2">
                        "{q.quote}"
                      </blockquote>
                      <p className="text-sm text-muted-foreground">— {q.author}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(q.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}