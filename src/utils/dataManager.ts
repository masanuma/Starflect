/**
 * ローカルストレージのデータをクリアする統一関数
 */
export const clearAllFortuneData = () => {
  console.log('🔍 【データクリア開始】削除前のローカルストレージ:', Object.keys(localStorage));
  
  const keys = Object.keys(localStorage);
  const deletedKeys: string[] = [];
  
  keys.forEach(key => {
    // チュートリアル完了フラグ以外はすべて削除
    if (key !== 'starflect_tutorial_completed') {
      // 基本データ
      if (key === 'birthData' || 
          key === 'horoscopeData' || 
          key === 'selectedMode' ||
          key === 'savedFormData' ||
          key === 'starflect-birth-data') {
        localStorage.removeItem(key);
        deletedKeys.push(key);
      }
      // 占い結果データ
      else if (key.startsWith('personality-analysis-') ||
               key.startsWith('level-1-fortune-') ||
               key.startsWith('level-2-fortune-') ||
               key.startsWith('level-3-fortune-') ||
               key.startsWith('level1_fortune_') ||
               key.startsWith('transit-analysis-') ||
               key.startsWith('astrology-chat-') ||
               key.startsWith('ai_chat_history_') ||
               key.startsWith('ai_analysis_') ||
               key.startsWith('three_planets_personality_') ||
               key.startsWith('level3_analysis_')) {
        localStorage.removeItem(key);
        deletedKeys.push(key);
      }
      // アプリケーション設定・フラグ
      else if (key === 'starflect_missing_data_mode' ||
               key === 'starflect_need_three_planets_input' ||
               key === 'starflect_new_fortune_start') {
        localStorage.removeItem(key);
        deletedKeys.push(key);
      }
    }
  });
  
  console.log('🔍 【データクリア完了】削除されたキー:', deletedKeys);
  console.log('🔍 【データクリア完了】削除後のローカルストレージ:', Object.keys(localStorage));
  
  return deletedKeys;
};

/**
 * データクリア確認ダイアログを表示する関数
 */
export const confirmAndClearData = (message: string): boolean => {
  const confirmed = window.confirm(message);
  
  if (confirmed) {
    const deletedKeys = clearAllFortuneData();
    alert(`過去の占い結果と入力データをリセットしました。\n削除されたデータ: ${deletedKeys.length}件`);
    return true;
  }
  
  return false;
}; 