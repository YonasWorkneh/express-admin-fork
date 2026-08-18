"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IoLocation, IoSearch, IoClose } from "react-icons/io5";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapAddressSelectorProps {
  onAddressSelect: (address: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  height?: string;
}

interface LocationMarkerProps {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  position,
  onPositionChange,
}) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className="p-2">
          <p className="font-medium">Selected Location</p>
          <p className="text-sm text-gray-600">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default function MapAddressSelector({
  onAddressSelect,
  initialAddress = "",
  initialLat,
  initialLng,
  height = "400px",
}: MapAddressSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(initialLat && initialLng ? [initialLat, initialLng] : null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Default center (Addis Ababa, Ethiopia)
  const defaultCenter: [number, number] = [9.0192, 38.7525]; //9.0192° N, 38.7525° E

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        const address = data.display_name;
        setSearchQuery(address);
        onAddressSelect({
          address,
          latitude: lat,
          longitude: lng,
        });
        setIsMapVisible(false);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResultClick = (result: {
    lat: string;
    lon: string;
    display_name: string;
    address: string;
  }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;

    setSelectedPosition([lat, lng]);
    setSearchQuery(address);
    setShowSearchResults(false);
    setIsMapVisible(false);
    onAddressSelect({
      address,
      latitude: lat,
      longitude: lng,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchAddress(value);
  };

  const clearSelection = () => {
    setSelectedPosition(null);
    setSearchQuery("");
    setShowSearchResults(false);
    onAddressSelect({
      address: "",
      latitude: 0,
      longitude: 0,
    });
  };

  const toggleMap = () => {
    setIsMapVisible(!isMapVisible);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for an address..."
              className="pl-10 pr-10 py-7"
            />
            {searchQuery && (
              <button
                onClick={clearSelection}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <IoClose className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={toggleMap}
            className="flex items-center gap-2 cursor-pointer"
          >
            <IoLocation className="h-4 w-4" />
            {isMapVisible ? "Hide Map" : "Show Map"}
          </Button>
        </div>

        {/* Map Container — overlays below the input instead of pushing the page layout down */}
        {isMapVisible && (
          <Card className="absolute z-40 w-full mt-1 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <IoLocation className="h-4 w-4" />
                  Select Location on Map
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setIsMapVisible(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close map"
                >
                  <IoClose className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height, width: "100%" }}>
                <MapContainer
                  center={selectedPosition || defaultCenter}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  className="rounded-lg"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker
                    position={selectedPosition}
                    onPositionChange={handleMapClick}
                  />
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(
              (
                result: {
                  lat: string;
                  lon: string;
                  address: string;
                  display_name: string;
                },
                index
              ) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <IoLocation className="h-4 w-4 text-[#EE1E21] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">
                        {result.display_name}
                      </p>
                      {result.address && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Object.values(result.address)
                            .filter(Boolean)
                            .slice(0, 3)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EE1E21]"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  );
}
