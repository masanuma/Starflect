// Netlify Functions形式のOpenAI APIプロキシ（Railway対応）
exports.handler = async (event, context) => {
  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // プリフライトリクエストの処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POSTメソッドのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 環境変数からAPIキーを取得
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API configuration error' }),
      };
    }

    // リクエストボディを解析
    const requestBody = JSON.parse(event.body);
    
    // OpenAI APIに転送
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OpenAI API Error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify(data),
      };
    }

    // 成功レスポンスを返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('❌ Proxy Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
