import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Default premade voices (work on free tier via API):
//   George   JBFqnCBsd6RMkjVDRZzb
//   Sarah    EXAVITQu4vr4xnSDxMaL
// Override with ELEVENLABS_VOICE_ID in .env.local once upgraded.
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn("[api/tts] ELEVENLABS_API_KEY is not set in env");
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      message = parsed?.detail?.message || parsed?.detail?.status || parsed?.error || bodyText;
    } catch { }
    console.error(`[api/tts] ElevenLabs ${res.status}: ${message}`);
    return NextResponse.json({ error: message }, { status: res.status });
  }

  const audioBuffer = await res.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audioBuffer.byteLength),
    },
  });
}
