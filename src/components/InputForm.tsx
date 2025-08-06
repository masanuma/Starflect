import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData } from '../types';
import LocationPicker from './LocationPicker';
type FortuneMode = 'sun-sign' | 'ten-planets' | 'ai-chat';

interface InputFormProps {
  mode?: FortuneMode;
  onBackToModeSelection?: () => void;
}

const InputForm: React.FC<InputFormProps> = ({ mode = 'ten-planets' }) => {
  const navigate = useNavigate();
  const birthTimeRef = useRef<HTMLInputElement>(null);
  
  console.log('🚨 InputForm初期化 - 受け取ったmode:', mode);
  console.log('🚨 InputForm初期化 - modeの型:', typeof mode);
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    timeType: 'exact' as 'exact' | 'approximate',
    timeRange: 'morning' as 'morning' | 'afternoon' | 'evening' | 'midnight',
    birthPlace: ''
  });
  const [locationData, setLocationData] = useState<{
    city: string;
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // 選択された年月に応じて日数を計算
  const getDaysInMonth = (year: number, month: number) => {
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  };

  const getSelectedYear = () => {
    if (!formData.birthDate) return new Date().getFullYear();
    return new Date(formData.birthDate).getFullYear();
  };

  const getSelectedMonth = () => {
    if (!formData.birthDate) return 1;
    return new Date(formData.birthDate).getMonth() + 1;
  };

  // 時間帯から代表時刻に変換するヘルパー関数
  const getApproximateTime = (timeRange: string): string => {
    switch (timeRange) {
      case 'morning':   return '09:00';  // 朝の代表時刻
      case 'afternoon': return '15:00';  // 昼の代表時刻  
      case 'evening':   return '21:00';  // 夜の代表時刻
      case 'midnight':  return '03:00';  // 深夜の代表時刻
      default:          return '12:00';  // デフォルト
    }
  };

  // 年のオプション配列を作成
  const yearOptions = Array.from({ length: new Date().getFullYear() - 1924 + 1 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: `${year}年` };
  });

  // 月のオプション配列を作成
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month, label: `${month}月` };
  });

  // 日のオプション配列を作成
  const dayOptions = Array.from({ length: getDaysInMonth(getSelectedYear(), getSelectedMonth()) }, (_, i) => {
    const day = i + 1;
    return { value: day, label: `${day}日` };
  });

  // コンポーネントマウント時に前回の入力値を復元
  useEffect(() => {
    console.log('🔍 InputForm - 初期化処理開始, mode:', mode);
    
    // レベルアップフラグをチェック
    const needThreePlanetsInput = localStorage.getItem('starflect_need_three_planets_input') === 'true';
    // データ不足フラグをチェック
    const missingDataMode = localStorage.getItem('starflect_missing_data_mode');
    
    console.log('🔍 レベルアップフラグ:', needThreePlanetsInput);
    console.log('🔍 データ不足フラグ:', missingDataMode);
    
    if (false) { // Level2削除により無効化
      // レベルアップフロー: 既存のbirthDataから名前と生年月日を復元
      console.log('🔍 レベルアップフロー: 既存データを復元');
      const existingBirthData = localStorage.getItem('birthData');
      if (existingBirthData) {
        try {
          const birthData = JSON.parse(existingBirthData!);
          console.log('🔍 既存の出生データ:', birthData);
          
          const restoredFormData = {
            name: birthData.name || '',
            birthDate: birthData.birthDate ? new Date(birthData.birthDate).toISOString().split('T')[0] : '',
            birthTime: '',
            timeType: 'exact' as 'exact' | 'approximate',
            timeRange: 'morning' as 'morning' | 'afternoon' | 'evening' | 'midnight',
            birthPlace: ''
          };
          
                     console.log('🔍 復元されたフォームデータ:', restoredFormData);
          setFormData(restoredFormData);
          
          // savedFormDataも更新して整合性を保つ
          localStorage.setItem('savedFormData', JSON.stringify(restoredFormData));
          
          // データ復元完了後にフラグを削除
          localStorage.removeItem('starflect_need_three_planets_input');
          console.log('🔍 レベルアップフラグを削除しました');
        } catch (error) {
          console.error('既存出生データの読み込みに失敗:', error);
        }
      }
    } else {
      // 通常フロー: savedFormDataから復元
      console.log('🔍 通常フロー: savedFormDataから復元');
      const savedFormData = localStorage.getItem('savedFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          console.log('🔍 保存されたフォームデータ:', parsedData);
          setFormData(parsedData);
        } catch (error) {
          console.error('保存されたフォームデータの読み込みに失敗:', error);
        }
      }
    }
    
    // データ不足から来た場合、出生時刻にフォーカスを当てる
    if (missingDataMode && mode === 'ten-planets') {
      console.log('🔍 データ不足からの遷移のため、出生時刻にフォーカスを当てます');
      setTimeout(() => {
        if (birthTimeRef.current) {
          birthTimeRef.current.focus();
        }
      }, 100);
    }
  }, [mode]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    console.log('🔍 === validateForm実行開始 ===');
    console.log('🔍 現在のmode:', mode);
    console.log('🔍 formData:', formData);
    console.log('🔍 locationData:', locationData);

    // お名前のバリデーション
    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください';
    }

    // 生年月日のバリデーション
    if (!formData.birthDate) {
      newErrors.birthDate = '生年月日を入力してください';
    } else {
      const date = new Date(formData.birthDate);
      if (isNaN(date.getTime()) || date > new Date()) {
        newErrors.birthDate = '有効な生年月日を入力してください';
      }
    }

    // 詳しい占いの場合のみ、出生時刻と出生地をバリデーション
    if (mode === 'ten-planets') {
      console.log('🔍 詳しい占いモード - 出生時刻・出生地をバリデーション');
      
      // 出生時刻のバリデーション
      if (formData.timeType === 'exact') {
        // 正確な時刻の場合：時刻入力が必須
        if (!formData.birthTime) {
          console.log('🔍 出生時刻が空です');
          newErrors.birthTime = '出生時刻を入力してください';
        } else {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(formData.birthTime)) {
            console.log('🔍 出生時刻の形式が正しくありません:', formData.birthTime);
            newErrors.birthTime = '正しい時刻形式（HH:MM）で入力してください';
          }
        }
      }
      // 大体の時刻の場合：時間帯が選択されていればOK（timeRangeは必ず設定されているのでチェック不要）

      // 出生地のバリデーション
      console.log('🔍 出生地バリデーション条件チェック:');
      console.log('  formData.birthPlace.trim():', formData.birthPlace.trim());
      console.log('  !formData.birthPlace.trim():', !formData.birthPlace.trim());
      console.log('  locationData:', locationData);
      console.log('  !locationData:', !locationData);
      
      // locationDataが存在するか、formData.birthPlaceが入力されている場合はOK
      const hasLocationData = locationData && locationData.latitude && locationData.longitude;
      const hasBirthPlace = formData.birthPlace.trim().length > 0;
      
      console.log('🔍 位置情報チェック:');
      console.log('  hasLocationData:', hasLocationData);
      console.log('  hasBirthPlace:', hasBirthPlace);
      
      if (!hasLocationData && !hasBirthPlace) {
        console.log('🔍 出生地バリデーションエラー: 位置情報も入力テキストも不足');
        newErrors.birthPlace = '出生地を入力してください';
      } else {
        console.log('🔍 出生地バリデーション OK');
      }
    } else {
      console.log('🔍 簡単占いモード - 出生時刻・出生地のバリデーションをスキップ');
    }

    console.log('🔍 バリデーション結果のエラー:', newErrors);
    console.log('🔍 === validateForm実行終了 ===');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚨 handleSubmit開始 - 現在のmode:', mode);
    console.log('🚨 handleSubmit開始 - modeの型:', typeof mode);
    
    if (!validateForm()) {
      console.log('🚨 バリデーション失敗により送信中止');
      return;
    }

    setIsLoading(true);

    try {
      // 時刻の計算（正確な時刻 or 大体の時刻）
      let finalBirthTime = '12:00'; // デフォルト
      if (mode === 'ten-planets') {
        if (formData.timeType === 'exact') {
          finalBirthTime = formData.birthTime;
        } else {
          finalBirthTime = getApproximateTime(formData.timeRange);
        }
      }

      // 位置データを使用して正確な座標を設定
      const birthData: BirthData = {
        name: formData.name || undefined,
        birthDate: new Date(formData.birthDate),
        birthTime: finalBirthTime,
        timeType: mode === 'ten-planets' ? formData.timeType : undefined,
        timeRange: (mode === 'ten-planets' && formData.timeType === 'approximate') ? formData.timeRange : undefined,
        birthPlace: {
          city: mode === 'ten-planets' ? (locationData?.city || formData.birthPlace) : '東京',
          latitude: mode === 'ten-planets' ? (locationData?.latitude || 35.6762) : 35.6762,
          longitude: mode === 'ten-planets' ? (locationData?.longitude || 139.6503) : 139.6503,
          timezone: 'Asia/Tokyo'
        }
      };

      // ローカルストレージに保存
      console.log('🔍 InputForm - 保存するデータ:');
      console.log('  birthData:', birthData);
      console.log('  mode:', mode);
      console.log('  保存するselectedMode:', mode || 'sun-sign');
      
      localStorage.setItem('birthData', JSON.stringify(birthData));
      
      // 選択されたモードを保存
      localStorage.setItem('selectedMode', mode || 'sun-sign');
      
      // 保存後の確認
      console.log('🔍 保存後のlocalStorage確認:');
      console.log('  selectedMode:', localStorage.getItem('selectedMode'));
      console.log('  birthData keys:', Object.keys(JSON.parse(localStorage.getItem('birthData') || '{}')));
      
      // 結果画面に遷移
      // ページトップに移動
      window.scrollTo(0, 0);
      navigate('/result');
    } catch (error) {
      console.error('Error processing birth data:', error);
      setErrors({ submit: 'データの処理中にエラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // 入力値をローカルストレージに自動保存
    localStorage.setItem('savedFormData', JSON.stringify(newFormData));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 年月日選択ハンドラー
  const handleDateChange = (field: 'year' | 'month' | 'day', value: string | number) => {
    const currentDate = formData.birthDate ? new Date(formData.birthDate) : new Date();
    const newDate = new Date(currentDate);
    
    if (field === 'year') {
      newDate.setFullYear(Number(value));
    } else if (field === 'month') {
      newDate.setMonth(Number(value) - 1);
    } else if (field === 'day') {
      newDate.setDate(Number(value));
    }
    
    handleInputChange('birthDate', newDate.toISOString().split('T')[0]);
  };

  const handleClearForm = () => {
    const emptyFormData = {
      name: '',
      birthDate: '',
      birthTime: '',
      timeType: 'exact' as 'exact' | 'approximate',
      timeRange: 'morning' as 'morning' | 'afternoon' | 'evening' | 'midnight',
      birthPlace: ''
    };
    setFormData(emptyFormData);
    setLocationData(null);
    localStorage.removeItem('savedFormData');
    setErrors({});
  };

  const handleLocationSelect = (location: {
    city: string;
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setLocationData(location);
    handleInputChange('birthPlace', location.address);
    
    // エラーをクリア
    if (errors.birthPlace) {
      setErrors(prev => ({ ...prev, birthPlace: '' }));
    }
  };

  return (
    <div className="input-form-container">
      <div className="form-card">
        <h2>あなたの出生情報を入力してください</h2>
        

        
        <form 
          onSubmit={handleSubmit} 
          className="birth-form"
          role="form"
          aria-label="出生情報入力フォーム"
          noValidate
        >
          <div className="input-group">
            <label htmlFor="name">お名前 *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="山田太郎"
              className={`form-input ${errors.name ? 'error' : ''}`}
              required
              aria-label="お名前を入力してください（必須項目）"
              aria-describedby={errors.name ? "name-error" : "name-hint"}
              aria-invalid={errors.name ? 'true' : 'false'}
              tabIndex={1}
            />
            <span id="name-hint" className="sr-only">お名前を入力してください</span>
            {errors.name && (
              <span 
                id="name-error" 
                className="error-message" 
                role="alert" 
                aria-live="polite"
              >
                {errors.name}
              </span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="birthDate">生年月日 *</label>
            <div className="date-picker-container">
              <div className="date-selectors">
                <div className="date-selector">
                  <label htmlFor="birthYear" className="sr-only">年</label>
                  <select
                    id="birthYear"
                    value={formData.birthDate ? new Date(formData.birthDate).getFullYear() : ''}
                    onChange={(e) => handleDateChange('year', e.target.value)}
                    className={`form-select ${errors.birthDate ? 'error' : ''}`}
                    aria-label="生年を選択してください"
                  >
                    <option value="">年</option>
                    {yearOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="date-selector">
                  <label htmlFor="birthMonth" className="sr-only">月</label>
                  <select
                    id="birthMonth"
                    value={formData.birthDate ? new Date(formData.birthDate).getMonth() + 1 : ''}
                    onChange={(e) => handleDateChange('month', e.target.value)}
                    className={`form-select ${errors.birthDate ? 'error' : ''}`}
                    aria-label="生月を選択してください"
                  >
                    <option value="">月</option>
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="date-selector">
                  <label htmlFor="birthDay" className="sr-only">日</label>
                  <select
                    id="birthDay"
                    value={formData.birthDate ? new Date(formData.birthDate).getDate() : ''}
                    onChange={(e) => handleDateChange('day', e.target.value)}
                    className={`form-select ${errors.birthDate ? 'error' : ''}`}
                    aria-label="生日を選択してください"
                  >
                    <option value="">日</option>
                    {dayOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <small id="birthDate-hint" className="input-hint">
              💡 プルダウンメニューから年、月、日を選択してください
            </small>
            {errors.birthDate && (
              <span 
                id="birthDate-error" 
                className="error-message" 
                role="alert" 
                aria-live="polite"
              >
                {errors.birthDate}
              </span>
            )}
          </div>

          {/* 詳しい占いの場合のみ出生時刻を表示 */}
          {mode === 'ten-planets' && (
            <div className="input-group birth-time-input-group">
              <label htmlFor="birthTime">出生時刻 *</label>
              
              {/* 時刻精度の選択 */}
              <div className="time-precision-selector">
                <label className={`precision-option ${formData.timeType === 'exact' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="timePrecision"
                    value="exact"
                    checked={formData.timeType === 'exact'}
                    onChange={(e) => handleInputChange('timeType', e.target.value)}
                  />
                  正確な時刻がわかる
                </label>
                <label className={`precision-option ${formData.timeType === 'approximate' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="timePrecision"
                    value="approximate"
                    checked={formData.timeType === 'approximate'}
                    onChange={(e) => handleInputChange('timeType', e.target.value)}
                  />
                  大体の時刻
                </label>
              </div>

              {/* 正確な時刻の場合 */}
              {formData.timeType === 'exact' && (
                <input
                  id="birthTime"
                  ref={birthTimeRef}
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => handleInputChange('birthTime', e.target.value)}
                  className={`form-input ${errors.birthTime ? 'error' : ''}`}
                  required
                  aria-label="出生時刻を入力してください（必須項目）"
                  aria-describedby={errors.birthTime ? "birthTime-error" : "birthTime-hint"}
                  aria-invalid={errors.birthTime ? 'true' : 'false'}
                  tabIndex={5}
                />
              )}

              {/* 大体の時刻の場合 */}
              {formData.timeType === 'approximate' && (
                <select
                  value={formData.timeRange}
                  onChange={(e) => handleInputChange('timeRange', e.target.value)}
                  className="form-input"
                  tabIndex={5}
                >
                  <option value="morning">☀️ 朝生まれ（6:00-12:00）</option>
                  <option value="afternoon">🌞 昼生まれ（12:00-18:00）</option>
                  <option value="evening">🌙 夕方・夜生まれ（18:00-24:00）</option>
                  <option value="midnight">🌌 深夜・明け方生まれ（0:00-6:00）</option>
                </select>
              )}
              
              <small id="birthTime-hint" className="input-hint">
                💡 出生時刻が分かると、月星座や上昇星座も占えます
              </small>
              {errors.birthTime && (
                <span 
                  id="birthTime-error" 
                  className="error-message" 
                  role="alert" 
                  aria-live="polite"
                >
                  {errors.birthTime}
                </span>
              )}
            </div>
          )}

          {/* 詳しい占いの場合のみ出生地を表示 */}
          {mode === 'ten-planets' && (
            <div className="input-group birth-place-input-group">
              <label htmlFor="birthPlace">出生地 *</label>
              <div 
                role="group" 
                aria-labelledby="birthPlace" 
                aria-describedby={errors.birthPlace ? "birthPlace-error" : "birthPlace-hint"}
              >
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialValue={formData.birthPlace}
                />
              </div>
              <small id="birthPlace-hint" className="input-hint">
                💡 正確な住所がわからない場合は、都道府県や市区町村でも占えます
              </small>
              {errors.birthPlace && (
                <span 
                  id="birthPlace-error" 
                  className="error-message" 
                  role="alert" 
                  aria-live="polite"
                >
                  {errors.birthPlace}
                </span>
              )}
            </div>
          )}

          {errors.submit && (
            <div 
              className="error-message submit-error" 
              role="alert" 
              aria-live="assertive"
            >
              {errors.submit}
            </div>
          )}

          <div className="form-buttons">
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
              aria-label={isLoading ? "分析を実行中です。しばらくお待ちください" : "入力した情報でホロスコープ分析を開始します"}
              aria-describedby="submit-hint"
              tabIndex={7}
            >
              {isLoading ? '分析中...' : '占いを始める'}
            </button>
            <span id="submit-hint" className="sr-only">全ての必須項目を入力後、このボタンで分析を開始できます</span>
            
            <button
              type="button"
              onClick={handleClearForm}
              className="clear-button"
              aria-label="入力した情報をすべてクリアします"
              tabIndex={8}
            >
              入力内容をクリア
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputForm; 