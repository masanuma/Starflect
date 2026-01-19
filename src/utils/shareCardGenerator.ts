import { HoroscopeData, BirthData } from '../types';
import { zodiacInfo } from './zodiacData';

export interface ShareCardData {
  sunSign: string;
  moonSign: string;
  ascSign: string;
  fortuneMessage: string; // 運勢の要約メッセージ
  rating?: number;        // 星の数（1-5）
  periodLabel?: string;   // 「今日の運勢」「1月の運勢」など
  theme?: 'gold' | 'azure' | 'purple'; // 画面に合わせたテーマ
}

/**
 * 占い結果をシェア用の画像（Canvas）として生成する
 */
export const generateShareCard = async (data: ShareCardData): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be created');

  // サイズ設定 (SNS投稿に最適な 1200x630)
  canvas.width = 1200;
  canvas.height = 630;

  // 1. 背景描画 (ラグジュアリーなグラデーション)
  const grad = ctx.createRadialGradient(600, 315, 0, 600, 315, 1000);
  
  if (data.theme === 'gold') {
    // 太陽の輝きテーマ (Amber/Gold)
    grad.addColorStop(0, '#451a03'); // 濃いアンバー
    grad.addColorStop(0.5, '#1e1b4b'); 
    grad.addColorStop(1, '#020617');
  } else if (data.theme === 'azure') {
    // 星々の共鳴テーマ (Azure/Blue)
    grad.addColorStop(0, '#0c4a6e'); // 濃いアズール
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
  } else {
    // デフォルト/AI対話テーマ (Purple)
    grad.addColorStop(0, '#2e1065'); // 濃いパープル
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
  }
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. 装飾（より緻密な幾何学模様 - アストロラーベ風）
  const drawGeometry = () => {
    ctx.save();
    ctx.translate(600, 315);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.1)';
    ctx.lineWidth = 1;

    // 同心円
    for (let r of [240, 260, 280, 300]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 十字ライン
    ctx.beginPath();
    ctx.moveTo(-350, 0); ctx.lineTo(350, 0);
    ctx.moveTo(0, -300); ctx.lineTo(0, 300);
    ctx.stroke();

    // 放射状ライン
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(240, 0);
      ctx.lineTo(300, 0);
      ctx.stroke();
    }
    ctx.restore();
  };
  drawGeometry();

  // 3. 星屑（多層的な奥行き）
  const drawStars = (count: number, maxSize: number, opacity: number) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * maxSize;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawStars(100, 0.8, 0.2);
  drawStars(50, 1.2, 0.4);

  // 4. タイトル・キャッチコピー
  ctx.textAlign = 'center';
  
  // キャッチコピー（好奇心をそそる文言）
  ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
  ctx.font = '20px "Noto Sans JP"';
  ctx.fillText('12星座を超えた、数百万分の1のあなたを解読する', 600, 50);

  // メインロゴ
  ctx.fillStyle = '#fde047'; // Ethereal Gold
  ctx.font = 'bold 64px "Cinzel", serif, "Noto Sans JP"';
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(253, 224, 71, 0.5)';
  ctx.fillText('Starflect', 600, 110);
  ctx.shadowBlur = 0;
  
  // サブタイトル
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 22px "Noto Sans JP"';
  ctx.fillText('COSMIC BLUEPRINT', 600, 145);

  // 5. 天体鑑定セクション（レイアウトの洗練）
  const drawSign = (x: number, y: number, label: string, sign: string, icon: string, color: string) => {
    // 背景の円芒
    const ringGrad = ctx.createRadialGradient(x, y + 60, 0, x, y + 60, 80);
    ringGrad.addColorStop(0, `${color}22`);
    ringGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(x, y + 60, 80, 0, Math.PI * 2);
    ctx.fill();

    // 枠線
    ctx.strokeStyle = `${color}44`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 60, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 20px "Noto Sans JP"';
    ctx.fillText(label, x, y);

    // アイコン
    ctx.fillStyle = '#fff';
    ctx.font = '64px "Noto Sans JP"';
    ctx.fillText(icon, x, y + 85);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 28px "Noto Sans JP"';
    ctx.fillText(sign, x, y + 135);
  };

  const sunIcon = (zodiacInfo as any)[data.sunSign]?.icon || '☀️';
  const moonIcon = data.moonSign !== '不明' ? (zodiacInfo as any)[data.moonSign]?.icon : '🌙';
  const ascIcon = data.ascSign !== '不明' ? (zodiacInfo as any)[data.ascSign]?.icon : '🌅';

  drawSign(300, 200, 'SUN (核)', data.sunSign, sunIcon, '#fbbf24');
  drawSign(600, 200, 'MOON (内面)', data.moonSign === '不明' ? '分析中' : data.moonSign, moonIcon || '🌙', '#7dd3fc');
  drawSign(900, 200, 'ASC (印象)', data.ascSign === '不明' ? '分析中' : data.ascSign, ascIcon || '🌅', '#c084fc');

  // 6. メッセージエリア
  const boxY = 380;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  ctx.roundRect(150, boxY, 900, 160, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.2)';
  ctx.stroke();

  // 期間ラベル
  if (data.periodLabel || data.rating) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px "Noto Sans JP"';
    const label = data.periodLabel ? `${data.periodLabel}の運勢` : '運命のメッセージ';
    ctx.fillText(label, 180, boxY + 35);
    
    if (data.rating) {
      const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
      ctx.textAlign = 'right';
      ctx.fillText(stars, 1020, boxY + 35);
    }
  }

  // メッセージテキスト
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 26px "Noto Sans JP"';
  
  const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const chars = text.split('');
    let line = '';
    let testY = y;
    let lineCount = 0;

    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, testY);
        line = chars[n];
        testY += lineHeight;
        lineCount++;
        if (lineCount >= 2) break; 
      } else {
        line = testLine;
      }
    }
    if (lineCount < 2) ctx.fillText(line, x, testY);
  };

  wrapText(data.fortuneMessage, 600, boxY + 85, 800, 42);

  // 7. フッター（ブランド感と誘導）
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '18px "Noto Sans JP"';
  ctx.fillText('※この鑑定結果は出生データに基づいたあなた独自のものです', 600, 570);

  // 検索窓風のデザイン
  const searchX = 400;
  const searchY = 590;
  ctx.fillStyle = 'rgba(253, 224, 71, 0.1)';
  ctx.beginPath();
  ctx.roundRect(searchX, searchY, 400, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 18px "Noto Sans JP"';
  ctx.fillText('🔍 Starflect で自分の運命をチェック', 600, searchY + 22);

  return canvas.toDataURL('image/png');
};

/**
 * 画像をダウンロードまたはネイティブ共有する
 */
export const shareImage = async (dataUrl: string, fileName: string = 'starflect-fortune.png') => {
  try {
    // CSPエラー(fetchのdataURL制限)を避けるため、手動でBlobに変換
    const base64Data = dataUrl.split(',')[1];
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/png' });
    const file = new File([blob], fileName, { type: 'image/png' });

    // Web Share API が利用可能な場合（スマホなど）
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Starflect 占い結果',
        text: '星が教える、私の真実。 #Starflect',
      });
    } else {
      // PCなどの場合はダウンロード
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error sharing image:', error);
    // 失敗した場合は通常のダウンロードを試行
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  }
};
