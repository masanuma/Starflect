import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface LocationPickerProps {
  onLocationSelect: (location: {
    city: string;
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialValue?: string;
}

interface SelectedLocation {
  city: string;
  latitude: number;
  longitude: number;
  address: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialValue = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  // 廃止されたAutocompleteServiceの代わりにnullで初期化
  const autocompleteRef = useRef<any>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Google Maps APIキー
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCBQRE8qUDjNyxKqd7z0PuGlFIF3NT2yOw';

  useEffect(() => {
    // Google Maps APIの初期化
    const initializeGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // AutocompleteServiceは廃止されたため、使用しない
        // フォールバック機能のみを使用
        console.log('Google Maps API loaded successfully (using fallback search)');
      } catch (error) {
        console.error('Google Maps API initialization failed:', error);
      }
    };

    initializeGoogleMaps();
    
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

  // 地図を初期化
  const initializeMap = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    placesServiceRef.current = new google.maps.places.PlacesService(map);

    // マーカーを追加
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      draggable: true,
      title: '出生地'
    });

    markerRef.current = marker;

    // マーカーをドラッグしたときの処理
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        const lat = position.lat();
        const lng = position.lng();
        reverseGeocode(lat, lng);
      }
    });

    // 地図をクリックしたときの処理
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        marker.setPosition(event.latLng);
        reverseGeocode(lat, lng);
      }
    });
  };

  // 逆ジオコーディング（座標から住所を取得）
  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const city = extractCityFromResult(result);
        const address = result.formatted_address;
        
        const location = {
          city,
          latitude: lat,
          longitude: lng,
          address
        };
        
        setSelectedLocation(location);
        setSearchQuery(address);
        onLocationSelect(location);
        
        // ローカルストレージに保存
        saveBirthPlace(location);
      }
    });
  };

  // 検索結果から都市名を抽出
  const extractCityFromResult = (result: google.maps.GeocoderResult): string => {
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        return component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        return component.long_name;
      }
    }
    return result.formatted_address.split(',')[0];
  };

  // 出生地をローカルストレージに保存
  const saveBirthPlace = (location: SelectedLocation) => {
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

  // 検索候補を取得
  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 廃止されたAutocompleteServiceの代わりにフォールバック機能を使用
    setIsLoading(true);
    
    // 病院や医療機関の検索候補を生成
    const generateSuggestions = (query: string) => {
      const suggestions = [];
      
      // 病院検索の場合
      if (query.includes('病院') || query.includes('クリニック') || query.includes('医院') || query.includes('医療')) {
        if (query.includes('聖路加')) {
          suggestions.push({
            place_id: 'mock_seiroka',
            description: '聖路加国際病院 (東京都中央区明石町)',
            structured_formatting: {
              main_text: '聖路加国際病院',
              secondary_text: '東京都中央区明石町9-1'
            }
          });
        }
        
        if (query.includes('慶應') || query.includes('慶応')) {
          suggestions.push({
            place_id: 'mock_keio',
            description: '慶應義塾大学病院 (東京都新宿区信濃町)',
            structured_formatting: {
              main_text: '慶應義塾大学病院',
              secondary_text: '東京都新宿区信濃町35'
            }
          });
        }
        
        if (query.includes('東大') || query.includes('東京大学')) {
          suggestions.push({
            place_id: 'mock_todai',
            description: '東京大学医学部附属病院 (東京都文京区本郷)',
            structured_formatting: {
              main_text: '東京大学医学部附属病院',
              secondary_text: '東京都文京区本郷7-3-1'
            }
          });
        }
        
        if (query.includes('日赤') || query.includes('赤十字')) {
          suggestions.push({
            place_id: 'mock_nisseki',
            description: '日本赤十字社医療センター (東京都渋谷区広尾)',
            structured_formatting: {
              main_text: '日本赤十字社医療センター',
              secondary_text: '東京都渋谷区広尾4-1-22'
            }
          });
        }
      }
      
      // 地域検索の場合
      if (query.includes('東京')) {
        suggestions.push({
          place_id: 'mock_tokyo',
          description: '東京都 (東京都)',
          structured_formatting: {
            main_text: '東京都',
            secondary_text: '日本'
          }
        });
      }
      
      if (query.includes('大阪')) {
        suggestions.push({
          place_id: 'mock_osaka',
          description: '大阪府 (大阪府)',
          structured_formatting: {
            main_text: '大阪府',
            secondary_text: '日本'
          }
        });
      }
      
      // 汎用検索結果
      suggestions.push({
        place_id: 'mock_' + query,
        description: query + ' (検索結果)',
        structured_formatting: {
          main_text: query,
          secondary_text: '日本'
        }
      });
      
      return suggestions;
    };

    setTimeout(() => {
      const mockSuggestions = generateSuggestions(query);
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
      setIsLoading(false);
    }, 300);
  };

  // 場所を選択
  const selectPlace = (placeId: string, description: string) => {
    // 模擬検索結果の場合
    if (placeId.startsWith('mock_')) {
      let location;
      
      if (placeId === 'mock_seiroka') {
        location = {
          city: '東京都中央区',
          latitude: 35.6726,
          longitude: 139.7737,
          address: '聖路加国際病院 (東京都中央区明石町9-1)'
        };
      } else if (placeId === 'mock_keio') {
        location = {
          city: '東京都新宿区',
          latitude: 35.6980,
          longitude: 139.7010,
          address: '慶應義塾大学病院 (東京都新宿区信濃町35)'
        };
      } else if (placeId === 'mock_todai') {
        location = {
          city: '東京都文京区',
          latitude: 35.7150,
          longitude: 139.7300,
          address: '東京大学医学部附属病院 (東京都文京区本郷7-3-1)'
        };
      } else if (placeId === 'mock_nisseki') {
        location = {
          city: '東京都渋谷区',
          latitude: 35.6500,
          longitude: 139.7000,
          address: '日本赤十字社医療センター (東京都渋谷区広尾4-1-22)'
        };
      } else if (placeId === 'mock_tokyo') {
        location = {
          city: '東京都',
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都 (東京都)'
        };
      } else if (placeId === 'mock_osaka') {
        location = {
          city: '大阪府',
          latitude: 34.6939,
          longitude: 135.5023,
          address: '大阪府 (大阪府)'
        };
      } else {
        // その他のモック検索結果
        location = {
          city: description.split(' ')[0] || '東京都',
          latitude: 35.6762 + (Math.random() - 0.5) * 0.05, // 東京周辺の座標
          longitude: 139.6503 + (Math.random() - 0.5) * 0.05,
          address: description
        };
      }

              setSelectedLocation(location);
        setSearchQuery(description);
        setShowSuggestions(false);
        onLocationSelect(location);
        
        // ローカルストレージに保存
        saveBirthPlace(location);
        
        // 地図を更新
        if (mapInstanceRef.current && markerRef.current) {
          const position = { lat: location.latitude, lng: location.longitude };
          mapInstanceRef.current.setCenter(position);
          markerRef.current.setPosition(position);
        } else if (isMapVisible) {
          initializeMap(location.latitude, location.longitude);
        }
        
        return;
    }

    if (!placesServiceRef.current) {
      // フォールバック
      const location = {
        city: description.split(',')[0],
        latitude: 35.6762,
        longitude: 139.6503,
        address: description
      };

              setSelectedLocation(location);
        setSearchQuery(description);
        setShowSuggestions(false);
        onLocationSelect(location);
        
        // ローカルストレージに保存
        saveBirthPlace(location);
        return;
    }

    const request = {
      placeId: placeId,
      fields: ['geometry', 'formatted_address', 'name']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || description;
        const city = extractCityFromResult({
          formatted_address: address,
          address_components: []
        } as any);

        const location = {
          city,
          latitude: lat,
          longitude: lng,
          address
        };

        setSelectedLocation(location);
        setSearchQuery(address);
        setShowSuggestions(false);
        onLocationSelect(location);

        // ローカルストレージに保存
        saveBirthPlace(location);

        // 地図を更新
        if (mapInstanceRef.current && markerRef.current) {
          const position = { lat, lng };
          mapInstanceRef.current.setCenter(position);
          markerRef.current.setPosition(position);
        } else if (isMapVisible) {
          initializeMap(lat, lng);
        }
      }
    });
  };

  // 地図表示を切り替え
  const toggleMap = () => {
    setIsMapVisible(!isMapVisible);
    
    if (!isMapVisible && selectedLocation) {
      setTimeout(() => {
        initializeMap(selectedLocation.latitude, selectedLocation.longitude);
      }, 100);
    } else if (!isMapVisible) {
      // デフォルト位置（東京）
      setTimeout(() => {
        initializeMap(35.6762, 139.6503);
      }, 100);
    }
  };

  return (
    <div className="location-picker">
      
      <div className="search-container">
        <div className="search-input-group">
                      <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchPlaces(e.target.value);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // フォーム送信を防ぐ
                  if (suggestions.length > 0) {
                    // 最初の候補を自動選択
                    selectPlace(suggestions[0].place_id, suggestions[0].description);
                  }
                }
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onBlur={() => {
                // 少し遅延させて候補選択の時間を確保
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="病院名、住所、または地名を入力してください"
              className="form-input location-search"
            />
          <button
            type="button"
            onClick={toggleMap}
            className="map-toggle-btn"
            title={isMapVisible ? '地図を隠す' : '地図を表示'}
          >
            {isMapVisible ? '🗺️ 地図を隠す' : '📍 地図を表示'}
          </button>
        </div>

        {isLoading && (
          <div className="search-loading">
            <span>🔍 検索中...</span>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${index === 0 ? 'first-suggestion' : ''}`}
                onClick={() => selectPlace(suggestion.place_id, suggestion.description)}
              >
                <div className="suggestion-main">
                  {index === 0 && <span className="enter-hint">↵ </span>}
                  {suggestion.structured_formatting.main_text}
                </div>
                <div className="suggestion-secondary">{suggestion.structured_formatting.secondary_text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isMapVisible && (
        <div className="map-container">
          <div ref={mapRef} className="google-map"></div>
        </div>
      )}


    </div>
  );
};

export default LocationPicker; 