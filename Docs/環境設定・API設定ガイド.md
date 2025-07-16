# 環境設定・API設定ガイド

## 📋 概要

このガイドでは、12星座別アカウント自動配信システムの実装に必要な環境設定とAPI設定について説明します。

## 🔧 開発環境セットアップ

### 必要なソフトウェア
- **Node.js**: v18.17.0以上
- **MongoDB**: v5.0以上
- **Redis**: v7.0以上
- **Docker**: v20.10以上（オプション）
- **Git**: v2.30以上

### 環境構築手順

#### 1. Node.js環境セットアップ
```bash
# nvmを使用したNode.js管理
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Node.js 18.17.0をインストール
nvm install 18.17.0
nvm use 18.17.0
nvm alias default 18.17.0

# バージョン確認
node --version
npm --version
```

#### 2. MongoDB セットアップ
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb

# macOS (Homebrew)
brew install mongodb-community@5.0

# Windows (MongoDB Compass推奨)
# https://www.mongodb.com/products/compass からダウンロード

# サービス開始
sudo systemctl start mongod
sudo systemctl enable mongod

# 接続テスト
mongo --eval "db.runCommand({ connectionStatus: 1 })"
```

#### 3. Redis セットアップ
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# macOS (Homebrew)
brew install redis

# Windows (Redis for Windows)
# https://github.com/microsoftarchive/redis/releases

# サービス開始
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 接続テスト
redis-cli ping
```

## 🔑 API設定

### 1. OpenAI API設定

#### アカウント作成・API キー取得
1. [OpenAI公式サイト](https://openai.com/)にアクセス
2. アカウント作成・ログイン
3. API Keys > Create new secret key
4. 生成されたAPIキーをメモ

#### 使用量・料金設定
```javascript
// 推奨設定
const openaiConfig = {
  model: "gpt-4-turbo-preview",
  max_tokens: 500,
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0
};

// 月間使用量制限設定
const usageLimit = {
  monthly_limit: 1000, // $1000/月
  daily_limit: 50,     // $50/日
  alert_threshold: 80  // 80%で警告
};
```

### 2. Instagram API設定

#### Meta for Developers アカウント設定
1. [Meta for Developers](https://developers.facebook.com/)にアクセス
2. アカウント作成・ログイン
3. 新しいアプリを作成
4. Instagram Basic Display APIを追加

#### Instagram Graph API設定
```javascript
// 必要な権限
const instagramScopes = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement'
];

// アクセストークン取得フロー
const getAccessToken = async () => {
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.INSTAGRAM_CLIENT_ID}&` +
    `redirect_uri=${process.env.REDIRECT_URI}&` +
    `scope=${instagramScopes.join(',')}&` +
    `response_type=code`;
  
  // ユーザーをauthUrlにリダイレクト
  // 承認後、codeを使用してアクセストークンを取得
};
```

#### 長期アクセストークン取得
```bash
# 短期トークンを長期トークンに変換
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app-id}&
  client_secret={app-secret}&
  fb_exchange_token={short-lived-token}"
```

### 3. Twitter API設定

#### Twitter Developer アカウント設定
1. [Twitter Developer Portal](https://developer.twitter.com/)にアクセス
2. アカウント作成・申請
3. プロジェクト・アプリを作成
4. API Keys & Tokens を取得

#### API設定
```javascript
// 必要なキー
const twitterConfig = {
  api_key: process.env.TWITTER_API_KEY,
  api_secret: process.env.TWITTER_API_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
  bearer_token: process.env.TWITTER_BEARER_TOKEN
};

// OAuth 2.0 設定
const oauth2Config = {
  client_id: process.env.TWITTER_CLIENT_ID,
  client_secret: process.env.TWITTER_CLIENT_SECRET,
  redirect_uri: process.env.TWITTER_REDIRECT_URI,
  scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
};
```

### 4. TikTok API設定

#### TikTok for Business アカウント設定
1. [TikTok for Business](https://business.tiktok.com/)にアクセス
2. ビジネスアカウント作成
3. API Access申請
4. アプリ作成・承認

#### API設定
```javascript
// TikTok API設定
const tiktokConfig = {
  client_key: process.env.TIKTOK_CLIENT_KEY,
  client_secret: process.env.TIKTOK_CLIENT_SECRET,
  redirect_uri: process.env.TIKTOK_REDIRECT_URI,
  scopes: ['user.info.basic', 'video.publish', 'video.list']
};

// OAuth認証フロー
const getTikTokAuthUrl = () => {
  const authUrl = `https://www.tiktok.com/auth/authorize/?` +
    `client_key=${tiktokConfig.client_key}&` +
    `scope=${tiktokConfig.scopes.join(',')}&` +
    `response_type=code&` +
    `redirect_uri=${tiktokConfig.redirect_uri}`;
  
  return authUrl;
};
```

## 📁 設定ファイル

### 環境変数設定 (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/starflect-zodiac
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=500

# Instagram API
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/auth/instagram/callback

# Twitter API
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_SECRET=your-twitter-access-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_REDIRECT_URI=https://your-domain.com/auth/twitter/callback

# TikTok API
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_REDIRECT_URI=https://your-domain.com/auth/tiktok/callback

# Security
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key
SESSION_SECRET=your-session-secret

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
ERROR_LOG_PATH=./logs/error.log

# Backup
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=7
```

### データベース設定 (config/database.js)
```javascript
const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // 接続エラーの処理
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // プロセス終了時の処理
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDatabase;
```

### Redis設定 (config/redis.js)
```javascript
const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.client.on('end', () => {
      console.log('Redis connection ended');
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.disconnect();
  }

  getClient() {
    return this.client;
  }
}

module.exports = new RedisClient();
```

## 🚀 デプロイメント設定

### AWS EC2 デプロイ設定
```bash
# EC2インスタンス準備
sudo apt-get update
sudo apt-get install -y curl git

# Node.js インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 インストール（プロセス管理）
sudo npm install -g pm2

# アプリケーションデプロイ
git clone https://github.com/your-repo/starflect-zodiac.git
cd starflect-zodiac
npm install
npm run build

# PM2 設定
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### PM2 設定 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [
    {
      name: 'starflect-zodiac',
      script: 'src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### Nginx設定 (nginx.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream backend {
        server localhost:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # HTTP to HTTPS redirect
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 静的ファイル配信
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 📊 監視・ログ設定

### Prometheus設定 (prometheus.yml)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'starflect-zodiac'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['localhost:9216']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
```

### Grafana ダッシュボード設定
```json
{
  "dashboard": {
    "title": "Starflect Zodiac Monitoring",
    "panels": [
      {
        "title": "投稿数",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(posts_total[5m])",
            "legendFormat": "{{zodiac}} - {{platform}}"
          }
        ]
      },
      {
        "title": "エンゲージメント率",
        "type": "singlestat",
        "targets": [
          {
            "expr": "avg(engagement_rate)",
            "legendFormat": "平均エンゲージメント率"
          }
        ]
      },
      {
        "title": "API応答時間",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(api_response_time_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## 🔐 セキュリティ設定

### ファイアウォール設定
```bash
# UFW設定
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # App (内部のみ)
sudo ufw deny 27017/tcp # MongoDB (外部アクセス禁止)
sudo ufw deny 6379/tcp  # Redis (外部アクセス禁止)

# 確認
sudo ufw status
```

### SSL証明書設定
```bash
# Let's Encrypt証明書取得
sudo apt-get install certbot python3-certbot-nginx

# 証明書取得
sudo certbot --nginx -d your-domain.com

# 自動更新設定
sudo crontab -e
# 以下を追加
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📝 テスト・デバッグ設定

### Jest設定 (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/coverage/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  globalTeardown: '<rootDir>/src/tests/teardown.js'
};
```

### ESLint設定 (.eslintrc.js)
```javascript
module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2]
  }
};
```

## 🎯 チェックリスト

### 開発環境チェック
- [ ] Node.js v18.17.0以上インストール済み
- [ ] MongoDB 動作確認済み
- [ ] Redis 動作確認済み
- [ ] OpenAI API キー設定済み
- [ ] Instagram API 設定済み
- [ ] Twitter API 設定済み
- [ ] TikTok API 設定済み
- [ ] 環境変数 (.env) 設定済み

### 本番環境チェック
- [ ] サーバー設定完了
- [ ] ドメイン設定完了
- [ ] SSL証明書設定完了
- [ ] データベース設定完了
- [ ] バックアップ設定完了
- [ ] 監視設定完了
- [ ] セキュリティ設定完了
- [ ] ログ設定完了

### API制限チェック
- [ ] OpenAI API制限確認済み
- [ ] Instagram API制限確認済み
- [ ] Twitter API制限確認済み
- [ ] TikTok API制限確認済み

---

## 📞 サポート・トラブルシューティング

### よくある問題と解決方法

#### 1. MongoDB接続エラー
```bash
# サービス状態確認
sudo systemctl status mongod

# 再起動
sudo systemctl restart mongod

# ログ確認
sudo tail -f /var/log/mongodb/mongod.log
```

#### 2. Redis接続エラー
```bash
# サービス状態確認
sudo systemctl status redis

# 再起動
sudo systemctl restart redis

# 接続テスト
redis-cli ping
```

#### 3. API制限エラー
```javascript
// レート制限ハンドリング
const handleRateLimit = async (error, retryAfter) => {
  console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  return true; // リトライを実行
};
```

### 緊急時連絡先
- **技術サポート**: tech-support@your-domain.com
- **運用サポート**: ops-support@your-domain.com
- **24時間対応**: emergency@your-domain.com

---

**最終更新**: 2025年1月9日
**バージョン**: 1.0 