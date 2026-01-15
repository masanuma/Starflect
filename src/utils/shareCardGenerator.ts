import { HoroscopeData, BirthData } from '../types';
import { zodiacInfo } from './zodiacData';

export interface ShareCardData {
  sunSign: string;
  moonSign: string;
  ascSign: string;
  fortuneMessage: string; // 運勢の要約メッセージ
  rating?: number;        // 星の数（1-5）
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

  // 1. 背景描画 (Deep Cosmos グラデーション)
  const grad = ctx.createRadialGradient(600, 315, 0, 600, 315, 800);
  grad.addColorStop(0, '#1a1c3d'); // 星雲の紺
  grad.addColorStop(1, '#0a0b1e'); // 真夜中の青
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. 装飾（微細な星屑）
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. タイトル・ロゴ
  ctx.fillStyle = '#fde047'; // Ethereal Gold
  ctx.font = 'bold 44px "Cinzel", serif, "Noto Sans JP"';
  ctx.textAlign = 'center';
  ctx.fillText('Starflect', 600, 70);
  
  ctx.fillStyle = 'rgba(253, 224, 71, 0.6)';
  ctx.font = '20px "Noto Sans JP"';
  ctx.fillText('星の導きが、明日を照らす。', 600, 105);

  // 4. 天体鑑定セクション (少し上に寄せる)
  const drawSign = (x: number, y: number, label: string, sign: string, icon: string) => {
    ctx.fillStyle = '#7dd3fc'; // Ethereal Blue
    ctx.font = 'bold 22px "Noto Sans JP"';
    ctx.fillText(label, x, y);

    ctx.fillStyle = '#fff';
    ctx.font = '64px "Noto Sans JP"';
    ctx.fillText(icon, x, y + 80);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px "Noto Sans JP"';
    ctx.fillText(sign, x, y + 130);
  };

  const sunIcon = (zodiacInfo as any)[data.sunSign]?.icon || '☀️';
  const moonIcon = data.moonSign !== '不明' ? (zodiacInfo as any)[data.moonSign]?.icon : '🌙';
  const ascIcon = data.ascSign !== '不明' ? (zodiacInfo as any)[data.ascSign]?.icon : '🌅';

  drawSign(300, 160, '太陽', data.sunSign, sunIcon);
  drawSign(600, 160, '月', data.moonSign === '不明' ? '分析中' : data.moonSign, moonIcon || '🌙');
  drawSign(900, 160, '上昇星座', data.ascSign === '不明' ? '分析中' : data.ascSign, ascIcon || '🌅');

  // 5. 運勢スコア (星の表示)
  if (data.rating) {
    const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 32px "Noto Sans JP"';
    ctx.fillText(stars, 600, 340);
  }

  // 6. メッセージエリア (中央に配置)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(150, 360, 900, 180, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 引用符
  ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
  ctx.font = 'bold 60px "Cinzel"';
  ctx.fillText('“', 190, 420);
  ctx.fillText('”', 1010, 520);

  // メッセージテキスト
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px "Noto Sans JP"';
  ctx.textAlign = 'center';

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
        if (lineCount >= 3) break; // 最大3行まで
      } else {
        line = testLine;
      }
    }
    if (lineCount < 3) ctx.fillText(line, x, testY);
  };

  wrapText(data.fortuneMessage, 600, 435, 780, 45);

  // 7. フッター
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 24px "Noto Sans JP"';
  ctx.fillText(`#Starflect | 星が教える今の運勢`, 600, 590);

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
