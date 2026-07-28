import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // AI Recommendation Engine Endpoint
  app.post("/api/recommendations", async (req, res) => {
    try {
      const { likedTracks, favoriteGenres, historyTracks, allTracks, currentMood } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          recommendations: generateLocalFallbackRecommendations(likedTracks, favoriteGenres, allTracks),
          source: "local_heuristic"
        });
      }

      const prompt = `
Ты — интеллектуальная рекомендательная система минималистичного музыкального плеера MonoSound.
Проанализируй предпочтения пользователя:
- Любимые жанры: ${JSON.stringify(favoriteGenres || {})}
- Любимые треки: ${JSON.stringify(likedTracks || [])}
- Недавно прослушано: ${JSON.stringify(historyTracks || [])}
- Настроение/пожелание: "${currentMood || 'Стандартный микс'}"

Доступный каталог треков:
${JSON.stringify(allTracks || [])}

Выбери от 3 до 6 наиболее подходящих треков из каталога (используй их id) и сформируй причину рекомендации на русском языке.
Причина должна быть емкой, интересной и точно объяснять, почему трек подходит под вкусы пользователя.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Отвечай только в формате JSON согласно заданной схеме.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trackId: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER, description: "От 1 до 100" },
                    category: { type: Type.STRING, description: "like_based, genre_match, artist_affinity, ai_curated, discovery" }
                  },
                  required: ["trackId", "reason", "matchScore", "category"]
                }
              },
              summaryText: { type: Type.STRING, description: "Короткий вывод об аудиальном профиле пользователя" }
            },
            required: ["recommendations", "summaryText"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        recommendations: parsed.recommendations || [],
        summaryText: parsed.summaryText || "Персональный микс сформирован на основе ваших предпочтений.",
        source: "gemini_ai"
      });

    } catch (err) {
      console.error("AI Recommendation error:", err);
      // Fallback gracefully
      const { likedTracks, favoriteGenres, allTracks } = req.body;
      res.json({
        recommendations: generateLocalFallbackRecommendations(likedTracks, favoriteGenres, allTracks),
        summaryText: "Подборка сформирована на основе алгоритма жанрового совпадения.",
        source: "local_fallback"
      });
    }
  });

  // AI Mood / Smart Playlist Generator Endpoint
  app.post("/api/ai-playlist", async (req, res) => {
    try {
      const { prompt: userPrompt, allTracks } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          title: `Микс: ${userPrompt || 'Фокус'}`,
          description: `Плейлист сгенерирован под запрос: ${userPrompt}`,
          trackIds: (allTracks || []).slice(0, 4).map((t: { id: string }) => t.id)
        });
      }

      const prompt = `
Создай персональный плейлист под запрос пользователя: "${userPrompt}"
Каталог треков: ${JSON.stringify(allTracks || [])}

Придумай название плейлиста на русском, стильное описание и отберите подходящие треки по их id.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              trackIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "description", "trackIds"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);

    } catch (err) {
      console.error("AI Playlist generation error:", err);
      const { prompt: userPrompt, allTracks } = req.body;
      res.json({
        title: `Микс: ${userPrompt || 'Подборка'}`,
        description: `Микс сформирован автоматически под вашу атмосферу.`,
        trackIds: (allTracks || []).slice(0, 5).map((t: { id: string }) => t.id)
      });
    }
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MonoSound Player Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateLocalFallbackRecommendations(likedTracks: any[], favoriteGenres: Record<string, number>, allTracks: any[]) {
  const topGenre = Object.entries(favoriteGenres || {}).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (allTracks || []).map((track: any) => {
    let score = 50;
    let reason = "Рекомендуется для открытия нового звучания.";
    let category = "discovery";

    if (topGenre && track.genre === topGenre) {
      score += 35;
      reason = `Вы часто слушаете ${topGenre}. Трек отлично дополняет вашу коллекцию.`;
      category = "genre_match";
    } else if (likedTracks && likedTracks.some((t: any) => t.artist === track.artist)) {
      score += 30;
      reason = `Трек любимого артиста (${track.artist}).`;
      category = "artist_affinity";
    } else if (track.isLiked) {
      score += 40;
      reason = "На основе ваших от отметок «Мне нравится».";
      category = "like_based";
    }

    const finalScore = Math.min(99, score + Math.floor(Math.random() * 10));
    return {
      trackId: track.id,
      reason,
      score: finalScore,
      matchScore: finalScore,
      category
    };
  }).slice(0, 5);
}

startServer();
