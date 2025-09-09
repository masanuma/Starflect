// OpenAI APIプロキシ - APIキーをサーバーサイドで安全に管理
export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 環境変数からAPIキーを取得（VITE_プレフィックスなし）
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      res.status(500).json({ error: 'API configuration error' });
      return;
    }

    // リクエストボディを取得
    const requestBody = req.body;
    
    // OpenAI APIに転送
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
      res.status(response.status).json(data);
      return;
    }

    // 成功レスポンスを返す
    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
