import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData } from '../types';
import LocationPicker from './LocationPicker';
type FortuneMode = 'sun-sign' | 'three-planets' | 'ten-planets' | 'ai-chat';

interface InputFormProps {
  mode?: FortuneMode;
  onBackToModeSelection?: () => void;
}

const InputForm: React.FC<InputFormProps> = ({ mode = 'ten-planets' }) => {
  const navigate = useNavigate();
  const birthTimeRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
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

  // コンポーネントマウント時に前回の入力値を復元
  useEffect(() => {
    console.log('🔍 InputForm - 初期化処理開始, mode:', mode);
    
    // レベルアップフラグをチェック
    const needThreePlanetsInput = localStorage.getItem('starflect_need_three_planets_input') === 'true';
    // データ不足フラグをチェック
    const missingDataMode = localStorage.getItem('starflect_missing_data_mode');
    
    console.log('🔍 レベルアップフラグ:', needThreePlanetsInput);
    console.log('🔍 データ不足フラグ:', missingDataMode);
    
    if (needThreePlanetsInput && mode === 'three-planets') {
      // レベルアップフロー: 既存のbirthDataから名前と生年月日を復元
      console.log('🔍 レベルアップフロー: 既存データを復元');
      const existingBirthData = localStorage.getItem('birthData');
      if (existingBirthData) {
        try {
          const birthData = JSON.parse(existingBirthData);
          console.log('🔍 既存の出生データ:', birthData);
          
          const restoredFormData = {
            name: birthData.name || '',
            birthDate: birthData.birthDate ? new Date(birthData.birthDate).toISOString().split('T')[0] : '',
            birthTime: '',
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
    if (missingDataMode && (mode === 'three-planets' || mode === 'ten-planets')) {
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
    if (mode === 'three-planets' || mode === 'ten-planets') {
      // 出生時刻のバリデーション
      if (!formData.birthTime) {
        newErrors.birthTime = '出生時刻を入力してください';
      } else {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formData.birthTime)) {
          newErrors.birthTime = '正しい時刻形式（HH:MM）で入力してください';
        }
      }

      // 出生地のバリデーション
      if (!formData.birthPlace.trim() && !locationData) {
        newErrors.birthPlace = '出生地を入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 位置データを使用して正確な座標を設定
      const birthData: BirthData = {
        name: formData.name || undefined,
        birthDate: new Date(formData.birthDate),
        // 簡単占いの場合は正午をデフォルト値として使用
        birthTime: (mode === 'three-planets' || mode === 'ten-planets') ? formData.birthTime : '12:00',
        birthPlace: {
          city: (mode === 'three-planets' || mode === 'ten-planets') ? (locationData?.city || formData.birthPlace) : '東京',
          latitude: (mode === 'three-planets' || mode === 'ten-planets') ? (locationData?.latitude || 35.6762) : 35.6762,
          longitude: (mode === 'three-planets' || mode === 'ten-planets') ? (locationData?.longitude || 139.6503) : 139.6503,
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

  const handleClearForm = () => {
    const emptyFormData = {
      name: '',
      birthDate: '',
      birthTime: '',
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
            <input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className={`form-input ${errors.birthDate ? 'error' : ''}`}
              required
              aria-label="生年月日を選択してください（必須項目）"
              aria-describedby={errors.birthDate ? "birthDate-error" : "birthDate-hint"}
              aria-invalid={errors.birthDate ? 'true' : 'false'}
              tabIndex={2}
            />
            <span id="birthDate-hint" className="sr-only">カレンダーから生年月日を選択してください</span>
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
          {(mode === 'three-planets' || mode === 'ten-planets') && (
            <div className="input-group">
              <label htmlFor="birthTime">出生時刻 *</label>
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
                tabIndex={3}
              />
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
          {(mode === 'three-planets' || mode === 'ten-planets') && (
            <div className="input-group">
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
                💡 出生地により、より正確な星の配置が分かります
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
              tabIndex={4}
            >
              {isLoading ? '分析中...' : '占いを始める'}
            </button>
            <span id="submit-hint" className="sr-only">全ての必須項目を入力後、このボタンで分析を開始できます</span>
            
            <button
              type="button"
              onClick={handleClearForm}
              className="clear-button"
              aria-label="入力した情報をすべてクリアします"
              tabIndex={5}
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