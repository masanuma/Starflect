/**
 * ローカルストレージのバージョン管理
 */
const DATA_VERSION_KEY = 'starflect_data_version';
const CURRENT_DATA_VERSION = '2.1.3'; // ローカルDBの現在のバージョン（Level3表示形式修正対応）

/**
 * ローカルDBの構造が変わったかチェックし、必要に応じて古いデータをクリア
 */
export const checkAndClearOldData = (): boolean => {
  const savedVersion = localStorage.getItem(DATA_VERSION_KEY);
  
  if (!savedVersion || savedVersion !== CURRENT_DATA_VERSION) {
    console.log('🔍 【バージョンチェック】古いデータ構造を検出:', savedVersion, '→', CURRENT_DATA_VERSION);
    
    // 基本情報は保持して、過去の結果のみクリア
    const preservedData = preserveBasicData();
    clearResultDataOnly();
    restoreBasicData(preservedData);
    
    // 新しいバージョンを保存
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    
    console.log('🔍 【バージョンアップ v2.1.3】Level3表示形式修正により古い占い結果をクリアしました。基本情報は保持されています。');
    return true;
  }
  
  return false;
};

/**
 * 基本情報（名前、生年月日、時刻、場所）を保持
 */
const preserveBasicData = () => {
  const basicData: Record<string, string | null> = {};
  
  // 保持するデータキー
  const preserveKeys = [
    'birthData',
    'savedFormData',
    'starflect-birth-data',
    'starflect_tutorial_completed'
  ];
  
  preserveKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      basicData[key] = value;
    }
  });
  
  return basicData;
};

/**
 * 基本情報を復元
 */
const restoreBasicData = (basicData: Record<string, string | null>) => {
  Object.entries(basicData).forEach(([key, value]) => {
    if (value) {
      localStorage.setItem(key, value);
    }
  });
};

/**
 * 過去の占い結果のみをクリアする関数
 */
export const clearResultDataOnly = (): string[] => {
  console.log('🔍 【結果データクリア開始】削除前のローカルストレージ:', Object.keys(localStorage));
  
  const keys = Object.keys(localStorage);
  const deletedKeys: string[] = [];
  
  keys.forEach(key => {
    // 占い結果データのみ削除（基本情報は保持）
    if (key.startsWith('level1_fortune_') ||
        key.startsWith('level3_analysis_') ||
        key.startsWith('ai_chat_history_') ||
        key === 'horoscopeData' ||
        key === 'selectedMode' ||
        key === 'previousMode') {
      localStorage.removeItem(key);
      deletedKeys.push(key);
    }
  });
  
  console.log('🔍 【結果データクリア完了】削除されたキー:', deletedKeys);
  return deletedKeys;
};

/**
 * 全データをクリアする関数（従来の機能）
 */
export const clearAllFortuneData = (): string[] => {
  console.log('🔍 【全データクリア開始】削除前のローカルストレージ:', Object.keys(localStorage));
  
  const keys = Object.keys(localStorage);
  const deletedKeys: string[] = [];
  
  keys.forEach(key => {
    // チュートリアル完了フラグ以外はすべて削除
    if (key !== 'starflect_tutorial_completed' && key !== DATA_VERSION_KEY) {
      if (key === 'birthData' || 
          key === 'horoscopeData' || 
          key === 'selectedMode' ||
          key === 'previousMode' ||
          key === 'savedFormData' ||
          key === 'starflect-birth-data' ||
          key.startsWith('level1_fortune_') ||
          key.startsWith('level3_analysis_') ||
          key.startsWith('ai_chat_history_')) {
        localStorage.removeItem(key);
        deletedKeys.push(key);
      }
    }
  });
  
  console.log('🔍 【全データクリア完了】削除されたキー:', deletedKeys);
  return deletedKeys;
};

/**
 * 過去の結果のみクリア確認ダイアログ
 */
export const confirmAndClearResultsOnly = (message?: string): boolean => {
  const defaultMessage = '過去の占い結果をクリアしますか？\n\n名前、生年月日、時刻、生まれた場所の情報は保持されます。\n占い結果のみが削除され、再度占いを実行できます。';
  const confirmed = window.confirm(message || defaultMessage);
  
  if (confirmed) {
    const deletedKeys = clearResultDataOnly();
    alert(`過去の占い結果をクリアしました。\n削除されたデータ: ${deletedKeys.length}件\n\n基本情報（名前、生年月日等）は保持されています。`);
    return true;
  }
  
  return false;
};

/**
 * 全データクリア確認ダイアログ（従来の機能）
 */
export const confirmAndClearData = (message: string): boolean => {
  const confirmed = window.confirm(message);
  
  if (confirmed) {
    const deletedKeys = clearAllFortuneData();
    alert(`すべてのデータをリセットしました。\n削除されたデータ: ${deletedKeys.length}件`);
    return true;
  }
  
  return false;
};

/**
 * アプリ初期化時にバージョンチェックを実行
 */
export const initializeDataManager = (): void => {
  checkAndClearOldData();
}; 