import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// .env 読み込み
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value.trim();
        }
      });
      console.log('📝 .env file loaded');
    }
  } catch (err) {
    console.error('❌ .env load error:', err);
  }
}

loadEnv();

// 未キャッチのエラーをログ出力
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use(cors());
app.use(express.json());

// ロギング
app.use((req, res, next) => {
  if (req.url.includes('api')) {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Geminiプロキシ
app.post('/api/gemini-proxy', async (req, res) => {
  console.log('🔮 Gemini Proxy: Request received');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ API Key missing in .env');
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
    }

    const { messages, temperature, max_tokens } = req.body;
    let systemText = "";
    const contents = [];
    
    messages.forEach(msg => {
      if (msg.role === 'system') systemText += msg.content + "\n";
      else contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || "" }]
      });
    });

    if (systemText) {
      const prefix = `【占いの指針】\n${systemText}\n\n`;
      if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = prefix + contents[0].parts[0].text;
      } else {
        contents.unshift({ role: 'user', parts: [{ text: prefix + "占いを開始してください。" }] });
      }
    }

    if (contents.length === 0) contents.push({ role: 'user', parts: [{ text: "占いを開始してください。" }] });

    // 2026年時点での最新安定モデル gemini-2.0-flash を使用 (v1)
    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    console.log(`📡 Calling Google API (${model})...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: temperature || 0.8,
          maxOutputTokens: max_tokens || 1000
        }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse Google API response as JSON:', responseText);
      return res.status(500).json({ error: 'Google API returned non-JSON response', detail: responseText });
    }
    
    if (!response.ok) {
      console.error('❌ Google API Error:', JSON.stringify(data, null, 2));
      return res.status(response.status).json({ error: 'Google API Error', detail: data });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`✅ Success! Response length: ${text.length}`);
    
    res.json({
      choices: [{
        message: { role: "assistant", content: text },
        finish_reason: "stop"
      }]
    });
  } catch (error) {
    console.error('❌ Proxy Exception:', error);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not Found');
    }
  } else {
    next();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BACKEND READY: http://localhost:${PORT}`);
});
