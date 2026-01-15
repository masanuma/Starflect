import React, { useState, useEffect, useRef } from 'react';
import './LocationPicker.css';

interface LocationPickerProps {
  onLocationSelect: (location: {
    city: string;
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialValue?: string;
}

// フォールバック用のよく検索される場所のリスト
const FALLBACK_PLACES = {
  '東京都': { lat: 35.6762, lng: 139.6503, address: '東京都, 日本' },
  '大阪府': { lat: 34.6937, lng: 135.5023, address: '大阪府, 日本' },
  '愛知県': { lat: 35.1815, lng: 136.9066, address: '愛知県名古屋市, 日本' },
  '福岡県': { lat: 33.5904, lng: 130.4017, address: '福岡県, 日本' },
  '北海道': { lat: 43.0643, lng: 141.3469, address: '北海道札幌市, 日本' },
  '聖路加国際病院': { lat: 35.6726, lng: 139.7737, address: '聖路加国際病院, 東京都中央区明石町9-1' },
  '慶應義塾大学病院': { lat: 35.6980, lng: 139.7010, address: '慶應義塾大学病院, 東京都新宿区信濃町35' },
  '東京大学医学部附属病院': { lat: 35.7150, lng: 139.7300, address: '東京大学医学部附属病院, 東京都文京区本郷7-3-1' },
  '豊島病院': { lat: 35.7308, lng: 139.7106, address: '豊島病院, 東京都板橋区栄町33-1' },
  '日本赤十字社医療センター': { lat: 35.6500, lng: 139.7000, address: '日本赤十字社医療センター, 東京都渋谷区広尾4-1-22' }
};

declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialValue = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [selectedLocation, setSelectedLocation] = useState<{
    city: string;
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState({ lat: '', lng: '' });
  const [apiError, setApiError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const serviceRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMapsScript();
    // 保存された出生地データを復元
    const savedBirthData = localStorage.getItem('starflect-birth-data');
    if (savedBirthData) {
      try {
        const birthData = JSON.parse(savedBirthData);
        if (birthData.birthPlace) {
          setSearchQuery(birthData.birthPlace.address || '');
          setSelectedLocation({
            city: birthData.birthPlace.city || '',
            latitude: birthData.birthPlace.latitude || 35.6762,
            longitude: birthData.birthPlace.longitude || 139.6503,
            address: birthData.birthPlace.address || ''
          });
        }
      } catch (error) {
        console.error('Failed to restore birth place data:', error);
      }
    }
  }, []);

  const loadGoogleMapsScript = () => {
    console.log('🔧 loadGoogleMapsScript called');
    
    // 既存のスクリプトタグをチェックして重複を防止
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('⚠️ Google Maps script already exists, skipping load');
      if (window.google && window.google.maps) {
                 // InvalidKeyMapErrorをチェック
         setTimeout(() => {
           try {
             // 簡単な地図作成テストでAPIキーの有効性をチェック
             const testDiv = document.createElement('div');
             new window.google.maps.Map(testDiv, { center: { lat: 35.6762, lng: 139.6503 }, zoom: 10 });
             setIsGoogleMapsLoaded(true);
             setApiError(null); // エラーをクリア
             console.log('✅ Google Maps API key validation successful');
                     } catch (error) {
             console.warn('⚠️ Google Maps API key validation failed, using fallback only:', error);
             setIsGoogleMapsLoaded(false);
             setApiError('Google Maps APIに接続できません。フォールバック検索を使用します。');
           }
        }, 1000);
      }
      return;
    }
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps already loaded');
      setIsGoogleMapsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('🔑 API Key available:', !!apiKey);
    
    if (!apiKey) {
      console.warn('⚠️ Google Maps API key not found, using fallback search');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ja&loading=async`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script'; // IDを追加して識別可能にする
    script.onload = () => {
      console.log('✅ Google Maps API script loaded successfully');
      console.log('📊 Google object:', window.google);
      
             // APIキーの有効性をテスト
       setTimeout(() => {
         try {
           const testDiv = document.createElement('div');
           new window.google.maps.Map(testDiv, { center: { lat: 35.6762, lng: 139.6503 }, zoom: 10 });
           setIsGoogleMapsLoaded(true);
           setApiError(null); // エラーをクリア
           console.log('✅ Google Maps API key validation successful');
                   } catch (error) {
             console.warn('⚠️ Google Maps API key validation failed, using fallback only:', error);
             if (error instanceof Error && error.message.includes('InvalidKeyMapError')) {
               console.error('🔑 APIキーエラー: Google Cloud Consoleで以下を確認してください:');
               console.error('1. Maps JavaScript API が有効化されている');
               console.error('2. APIキーの制限設定（HTTPリファラー制限など）');
               console.error('3. 請求先アカウントの設定');
               setApiError('Google Maps APIキーに問題があります。管理者にお問い合わせください。');
             } else {
               setApiError('Google Maps APIに接続できません。フォールバック検索を使用します。');
             }
             setIsGoogleMapsLoaded(false);
           }
      }, 1000);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API script:', error);
      setIsGoogleMapsLoaded(false);
    };
    document.head.appendChild(script);
    console.log('📜 Script added to document head with loading=async and validation');
  };

  // Google Geocoding APIを使った検索（PlacesService廃止対応）
  const searchPlacesWithGoogle = (query: string) => {
    if (!window.google || !window.google.maps) {
      console.log('Google Maps not available, using fallback');
      searchWithFallback(query);
      return;
    }

    try {
      if (!serviceRef.current) {
        // Geocoderを使用（PlacesServiceの代替）
        serviceRef.current = new window.google.maps.Geocoder();
      }

      const request = {
        address: `${query}, 日本`,
        componentRestrictions: { country: 'JP' },
        region: 'JP'
      };

      serviceRef.current.geocode(request, (results: any[], status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          console.log('🔍 Google Geocoding検索結果:', results);
          const placeSuggestions = results.slice(0, 8).map((result: any) => ({
            name: result.address_components[0]?.long_name || query,
            address: result.formatted_address,
            location: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            },
            types: result.types,
            placeId: result.place_id
          }));
          setSuggestions(placeSuggestions);
          setShowSuggestions(true);
        } else {
          console.log('Google Geocoding検索でエラー、フォールバックを使用:', status);
          searchWithFallback(query);
        }
      });
    } catch (error) {
      console.error('Google Geocoding検索エラー:', error);
      searchWithFallback(query);
    }
  };

  // フォールバック検索
  const searchWithFallback = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    const matchedSuggestions: any[] = [];

    Object.entries(FALLBACK_PLACES).forEach(([name, data]) => {
      if (name.toLowerCase().includes(normalizedQuery) || 
          normalizedQuery.includes(name.toLowerCase().substring(0, 2))) {
        matchedSuggestions.push({
          name: name,
          address: data.address,
          location: { lat: data.lat, lng: data.lng },
          types: name.includes('病院') ? ['hospital'] : ['locality'],
          isFallback: true
        });
      }
    });

    // 病院キーワード検索
    if (normalizedQuery.includes('病院') || normalizedQuery.includes('クリニック')) {
      Object.entries(FALLBACK_PLACES).forEach(([name, data]) => {
        if (name.includes('病院') && !matchedSuggestions.find(s => s.name === name)) {
          matchedSuggestions.push({
            name: name,
            address: data.address,
            location: { lat: data.lat, lng: data.lng },
            types: ['hospital'],
            isFallback: true
          });
        }
      });
    }

    console.log('📋 フォールバック検索結果:', matchedSuggestions);
    setSuggestions(matchedSuggestions.slice(0, 8));
    setShowSuggestions(matchedSuggestions.length > 0);
  };

  // 検索処理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 短い遅延を追加してAPI呼び出しを最適化
    const timeoutId = setTimeout(() => {
      if (isGoogleMapsLoaded) {
        searchPlacesWithGoogle(query);
      } else {
        searchWithFallback(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // 場所選択処理
  const handleLocationSelect = (suggestion: any) => {
    console.log('📍 Location selected:', suggestion);
    
    const location = {
      city: suggestion.name,
      latitude: suggestion.location.lat,
      longitude: suggestion.location.lng,
      address: suggestion.address
    };
    
    console.log('🎯 Location object:', location);

    setSelectedLocation(location);
    setSearchQuery(suggestion.address);
    setShowSuggestions(false);
    onLocationSelect(location);
    saveBirthPlace(location);

    // 地図を表示
    console.log('🔍 isGoogleMapsLoaded:', isGoogleMapsLoaded);
    if (isGoogleMapsLoaded) {
      console.log('🗺️ Setting showMap to true');
      setShowMap(true);
      setTimeout(() => {
        console.log('⏰ Calling initializeMap after timeout');
        initializeMap(location.latitude, location.longitude, suggestion.name);
      }, 100);
    } else {
      console.warn('⚠️ Google Maps not loaded, cannot show map');
    }
  };

  // 地図初期化
  const initializeMap = (lat: number, lng: number, placeName: string) => {
    console.log('🗺️ initializeMap called:', { lat, lng, placeName });
    console.log('📍 mapRef.current:', !!mapRef.current);
    console.log('🌐 window.google:', !!window.google);
    
    if (!mapRef.current) {
      console.error('❌ mapRef.current is null');
      setShowMap(false); // 地図表示を無効化
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error('❌ window.google.maps is not available');
      setShowMap(false); // 地図表示を無効化
      return;
    }

    try {
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative', // モバイル対応
        disableDefaultUI: false
      };
      
      console.log('🎛️ Creating map with options:', mapOptions);
      mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);
      console.log('✅ Map instance created:', !!mapInstance.current);

      // マーカーを追加
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance.current,
        title: placeName,
        animation: window.google.maps.Animation.DROP
      });
      console.log('📌 Marker created:', !!marker);

      // 地図読み込み完了イベント
      window.google.maps.event.addListener(mapInstance.current, 'idle', () => {
        console.log('🗺️ 地図読み込み完了');
      });

      console.log('🗺️ 地図表示完了:', placeName);
    } catch (error) {
      console.error('❌ 地図初期化エラー:', error);
      setShowMap(false); // エラー時は地図表示を無効化
      
      // InvalidKeyMapErrorの場合の特別なメッセージ
      if (error instanceof Error && error.message.includes('InvalidKeyMapError')) {
        console.warn('🔑 Google Maps APIキーに問題があります。フォールバック機能のみ利用可能です。');
      }
    }
  };

  // 手動座標入力処理
  const handleManualCoordinates = () => {
    const lat = parseFloat(manualCoordinates.lat);
    const lng = parseFloat(manualCoordinates.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('正しい座標を入力してください（例：35.6762, 139.6503）');
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('座標の範囲が正しくありません（緯度：-90～90、経度：-180～180）');
      return;
    }
    
    const location = {
      city: `緯度${lat.toFixed(4)}度, 経度${lng.toFixed(4)}度`,
      latitude: lat,
      longitude: lng,
      address: `緯度${lat.toFixed(4)}度, 経度${lng.toFixed(4)}度`
    };
    
    setSelectedLocation(location);
    setSearchQuery(location.address);
    setShowManualInput(false);
    onLocationSelect(location);
    saveBirthPlace(location);

    // 地図を表示
    if (isGoogleMapsLoaded) {
      setShowMap(true);
      setTimeout(() => {
        initializeMap(lat, lng, '指定座標');
      }, 100);
    }
  };

  // 出生地をローカルストレージに保存
  const saveBirthPlace = (location: { city: string; latitude: number; longitude: number; address: string }) => {
    try {
      const existingData = localStorage.getItem('starflect-birth-data');
      let birthData = existingData ? JSON.parse(existingData) : {};
      
      birthData.birthPlace = {
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      };
      
      localStorage.setItem('starflect-birth-data', JSON.stringify(birthData));
    } catch (error) {
      console.error('Failed to save birth place:', error);
    }
  };

  // 人気の場所を表示
  const showPopularPlaces = () => {
    const popularPlaces = Object.entries(FALLBACK_PLACES).slice(0, 6).map(([name, data]) => ({
      name: name,
      address: data.address,
      location: { lat: data.lat, lng: data.lng },
      types: name.includes('病院') ? ['hospital'] : ['locality'],
      isFallback: true
    }));
    setSuggestions(popularPlaces);
    setShowSuggestions(true);
  };

  const getPlaceTypeIcon = (types: string[]) => {
    if (types.includes('hospital') || types.includes('health')) return '🏥';
    if (types.includes('locality') || types.includes('administrative_area')) return '🏙️';
    if (types.includes('establishment')) return '📍';
    return '📍';
  };

  return (
    <div className="location-picker">
      <div className="search-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (suggestions.length === 0 && searchQuery.length === 0) {
              showPopularPlaces();
            } else if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="出生地を入力してください（例：豊島病院、東京都）"
          className="form-input"
        />
        
        <div className="location-actions">
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="manual-input-button"
          >
            📍 座標で指定
          </button>
          {selectedLocation && isGoogleMapsLoaded && (
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="manual-input-button"
            >
              🗺️ {showMap ? '地図を隠す' : '地図を表示'}
            </button>
          )}
        </div>

        {/* APIエラー表示 */}
        {apiError && (
          <div className="api-error-message">
            ⚠️ {apiError}
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleLocationSelect(suggestion)}
              >
                <div className="suggestion-main">
                  {getPlaceTypeIcon(suggestion.types)} {suggestion.name}
                </div>
                <div className="suggestion-secondary">
                  {suggestion.isFallback ? 'ローカル' : 'Google'}
                </div>
              </div>
            ))}
          </div>
        )}

        {showManualInput && (
          <div className="manual-coordinates-input">
            <div className="coordinate-inputs">
              <input
                type="text"
                placeholder="緯度 (例: 35.6762)"
                value={manualCoordinates.lat}
                onChange={(e) => setManualCoordinates({ ...manualCoordinates, lat: e.target.value })}
                className="form-input coordinate-input"
              />
              <input
                type="text"
                placeholder="経度 (例: 139.6503)"
                value={manualCoordinates.lng}
                onChange={(e) => setManualCoordinates({ ...manualCoordinates, lng: e.target.value })}
                className="form-input coordinate-input"
              />
            </div>
            <button onClick={handleManualCoordinates} className="form-button">
              座標を設定
            </button>
            <button 
              onClick={() => setShowManualInput(false)} 
              className="form-button secondary"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="selected-location">
          <div className="location-info">
            <strong>選択された場所:</strong> {selectedLocation.address}
            <br />
            <small>
              緯度: {selectedLocation.latitude.toFixed(4)}度, 
              経度: {selectedLocation.longitude.toFixed(4)}度
            </small>
          </div>
        </div>
      )}

      {showMap && (
        <div className="map-container">
          <div ref={mapRef} className="map-display"></div>
        </div>
      )}
      
    </div>
  );
};

export default LocationPicker; 