import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors({
  origin: true,
  credentials: true
}));

// JSON解析ミドルウェア
app.use(express.json());

// APIルートの設定
app.use('/api', async (req, res, next) => {
  if (req.path === '/openai-proxy' && req.method === 'POST') {
    try {
      // OpenAI APIプロキシ処理
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'API configuration error' });
      }

      const requestBody = req.body;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ OpenAI API Error:', data);
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      console.error('❌ Proxy Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  } else {
    next();
  }
});

// 静的ファイル配信
app.use(express.static(path.join(__dirname, 'dist')));

// SPAのフォールバック
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
});
