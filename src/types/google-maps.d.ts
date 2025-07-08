declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      addListener(eventName: string, handler: Function): void;
      setCenter(position: LatLng | LatLngLiteral): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null;
      addListener(eventName: string, handler: Function): void;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      draggable?: boolean;
      title?: string;
    }

    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
    }

    interface GeocoderRequest {
      location?: LatLng | LatLngLiteral;
      address?: string;
    }

    interface GeocoderResult {
      formatted_address: string;
      address_components: GeocoderAddressComponent[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapMouseEvent {
      latLng: LatLng | null;
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(request: AutocompletionRequest, callback: (predictions: AutocompletePrediction[], status: PlacesServiceStatus) => void): void;
      }

      class PlacesService {
        constructor(map: Map);
        getDetails(request: PlaceDetailsRequest, callback: (place: PlaceResult, status: PlacesServiceStatus) => void): void;
      }

      interface AutocompletionRequest {
        input: string;
        types?: string[];
      }

      interface AutocompletePrediction {
        place_id: string;
        description: string;
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }

      interface PlaceResult {
        geometry?: {
          location?: LatLng;
        };
        formatted_address?: string;
        name?: string;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        NOT_FOUND = 'NOT_FOUND',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }
    }
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
}

declare module 'ephimeris-moshier' {
  export class Ephemeris {
    constructor();
    getPlanetPosition(planetId: number, jd: number): {
      longitude: number; // ラジアン
      latitude: number;  // ラジアン
      distance: number;  // AU
    };
  }
} 