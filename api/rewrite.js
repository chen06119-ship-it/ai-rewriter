export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const { text } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "Text is required."
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        error: "Text is too long. Please keep it under 5000 characters."
      });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: "DeepSeek API key is not configured."
      });
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional paraphrasing assistant. Rewrite the user's text naturally, clearly, and fluently while keeping the original meaning. Do not add unrelated information."
          },
          {
            role: "user",
            content: `Paraphrase this text:\n\n${text}`
          }
        ],
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("DeepSeek API error:", data);

      return res.status(response.status).json({
        error: data.error?.message || "DeepSeek API error."
      });
    }

    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return res.status(500).json({
        error: "No response from DeepSeek."
      });
    }

    return res.status(200).json({
      result
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error. Please try again later."
    });
  }
}
