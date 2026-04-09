import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interests, goals } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const interestList = interests?.length > 0 ? interests.join(", ") : "personal growth, productivity";
    const goalContext = goals?.length > 0
      ? `The user is working on these goals: ${goals.map((g: { title: string }) => g.title).join(", ")}.`
      : "";

    // Add randomness factors for variety
    const quoteStyles = [
      "profound and philosophical",
      "short and punchy",
      "poetic and metaphorical",
      "practical and actionable",
      "humorous yet inspiring",
      "bold and empowering"
    ];
    const randomStyle = quoteStyles[Math.floor(Math.random() * quoteStyles.length)];

    const quoteSources = [
      "Generate an original quote",
      "Share a lesser-known quote from a famous thinker",
      "Create a modern interpretation of ancient wisdom",
      "Craft a quote inspired by successful entrepreneurs",
      "Generate a quote that sounds like it could be from a motivational speaker",
      "Share a famous motivational quote from anime like Naruto, Dragon Ball Z, Black Clover, One Piece, Attack on Titan, My Hero Academia, Demon Slayer, or Fullmetal Alchemist. Use the actual character name as the author (e.g. Naruto Uzumaki, Goku, Asta, Luffy, Eren Yeager, Deku, Tanjiro, Edward Elric)",
      "Share an iconic anime quote about never giving up, from shows like Naruto, Black Clover, Dragon Ball Z, or One Piece. Attribute it to the character who said it",
      "Share a powerful anime quote about surpassing your limits, from characters like Yami Sukehiro (Black Clover), Vegeta (Dragon Ball Z), Rock Lee (Naruto), or All Might (My Hero Academia)"
    ];
    const randomSource = quoteSources[Math.floor(Math.random() * quoteSources.length)];

    const timeOfDay = new Date().getHours();
    const timeContext = timeOfDay < 12 ? "morning energy and fresh starts" :
      timeOfDay < 17 ? "afternoon persistence and momentum" :
        "evening reflection and tomorrow's possibilities";

    const randomSeed = Math.random().toString(36).substring(7);

    const systemPrompt = `You are a creative motivational quote generator. ${randomSource} that is ${randomStyle}.

The user's interests are: ${interestList}
${goalContext}
Time context: Focus on ${timeContext}.
Uniqueness seed: ${randomSeed}

IMPORTANT: Generate a UNIQUE quote every time. Never repeat quotes. Be creative and varied.

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "quote": "The motivational quote text here",
  "author": "Author name or a creative attribution like 'Ancient Wisdom' or 'Modern Proverb' for original quotes",
  "interest": "The main interest category this quote relates to"
}

Make the quote feel personal, fresh, and inspiring. Vary the length, tone, and style.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a motivational quote for me today." },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate quote");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let quoteData;
    try {
      // Clean the response if it has markdown code blocks
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      quoteData = JSON.parse(cleanedContent);
    } catch {
      // Fallback if parsing fails
      quoteData = {
        quote: "Every day is a new opportunity to become a better version of yourself.",
        author: "Anonymous",
        interest: interestList.split(",")[0]?.trim() || "Personal Growth"
      };
    }

    return new Response(JSON.stringify(quoteData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-quote error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
