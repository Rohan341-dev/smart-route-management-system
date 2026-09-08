"""
SinoTrack ST-901A GPS Integration Service

Consumes GPS data from the SinoTrack platform (app.sinotrack.com)
and normalizes it into SmartBus internal format.

Architecture:
  SinoTrack API → SinoTrackService → Normalized GPS → BusLocation model

All credentials loaded from environment variables.
Never expose SinoTrack raw responses to frontend.
"""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

import requests
from django.conf import settings
from django.utils import timezone as django_timezone

logger = logging.getLogger(__name__)


class SinoTrackConfig:
    """SinoTrack API configuration from environment variables."""

    @staticmethod
    def get_api_url() -> str:
        return getattr(settings, 'SINOTRACK_API_URL', 'https://api.sinotrack.com')

    @staticmethod
    def get_username() -> str:
        return getattr(settings, 'SINOTRACK_USERNAME', '')

    @staticmethod
    def get_api_key() -> str:
        return getattr(settings, 'SINOTRACK_API_KEY', '')


class SinoTrackService:
    """
    Service layer for SinoTrack ST-901A GPS device integration.

    Handles:
    - Authentication with SinoTrack API
    - Fetching device list
    - Fetching latest location per device
    - Normalizing responses to SmartBus GPS format
    """

    def __init__(self):
        self.config = SinoTrackConfig()
        self.api_url = self.config.get_api_url().rstrip('/')
        self.session = requests.Session()
        self._authenticated = False

    def _get_headers(self) -> dict:
        """Build authentication headers for SinoTrack API."""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        api_key = self.config.get_api_key()
        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'
        return headers

    def _get_auth_params(self) -> dict:
        """Build query auth params (some SinoTrack APIs use query-based auth)."""
        params = {}
        username = self.config.get_username()
        api_key = self.config.get_api_key()
        if username:
            params['username'] = username
        if api_key:
            params['apikey'] = api_key
        return params

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[dict]:
        """Make authenticated request to SinoTrack API with error handling."""
        url = f"{self.api_url}{endpoint}"
        headers = self._get_headers()
        params = self._get_auth_params()

        if 'params' in kwargs:
            params.update(kwargs.pop('params'))
        kwargs.setdefault('headers', headers)
        kwargs.setdefault('params', params)
        kwargs.setdefault('timeout', 15)

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            logger.error(f"SinoTrack API timeout: {url}")
        except requests.exceptions.ConnectionError:
            logger.error(f"SinoTrack API connection error: {url}")
        except requests.exceptions.HTTPError as e:
            logger.error(f"SinoTrack API HTTP error: {e.response.status_code} - {url}")
        except Exception as e:
            logger.error(f"SinoTrack API unexpected error: {e}")

        return None

    def authenticate(self) -> bool:
        """
        Authenticate with SinoTrack API.
        Returns True if authentication is successful or already authenticated.
        """
        if self._authenticated:
            return True

        username = self.config.get_username()
        api_key = self.config.get_api_key()

        if not username or not api_key:
            logger.warning("SinoTrack credentials not configured. Running in demo mode.")
            return False

        data = self._make_request('POST', '/auth/login', json={
            'username': username,
            'password': api_key,
        })

        if data and data.get('success'):
            self._authenticated = True
            token = data.get('token', '')
            if token:
                self.session.headers['Authorization'] = f'Bearer {token}'
            logger.info("SinoTrack authentication successful")
            return True

        logger.warning("SinoTrack authentication failed - check credentials")
        return False

    def fetch_devices(self) -> list[dict]:
        """
        Fetch list of all devices from SinoTrack.
        Returns list of normalized device info dicts.
        """
        data = self._make_request('GET', '/device/list')
        if not data:
            return []

        devices = data if isinstance(data, list) else data.get('devices', data.get('data', []))

        normalized = []
        for device in devices:
            normalized.append({
                'device_id': str(device.get('deviceId', device.get('id', ''))),
                'device_name': device.get('deviceName', device.get('name', 'Unknown Device')),
                'device_model': device.get('deviceModel', device.get('model', 'ST-901A')),
                'imei': device.get('imei', ''),
                'status': 'active' if device.get('online', device.get('status') == 'online') else 'inactive',
                'last_seen': device.get('lastOnline', device.get('lastUpdate')),
            })

        logger.info(f"Fetched {len(normalized)} devices from SinoTrack")
        return normalized

    def fetch_latest_location(self, device_identifier: str) -> Optional[dict]:
        """
        Fetch latest GPS location for a specific device.
        Returns normalized GPS data dict.
        """
        data = self._make_request('GET', f'/device/{device_identifier}/location')
        if not data:
            return None

        return self._normalize_location(data, device_identifier)

    def fetch_all_locations(self) -> list[dict]:
        """
        Fetch latest GPS locations for all devices.
        Returns list of normalized GPS data dicts.
        """
        data = self._make_request('GET', '/device/locations')
        if not data:
            return []

        locations = data if isinstance(data, list) else data.get('locations', data.get('data', []))

        normalized = []
        for loc in locations:
            device_id = str(loc.get('deviceId', loc.get('id', '')))
            normalized_loc = self._normalize_location(loc, device_id)
            if normalized_loc:
                normalized.append(normalized_loc)

        logger.info(f"Fetched {len(normalized)} locations from SinoTrack")
        return normalized

    def fetch_device_status(self, device_identifier: str) -> Optional[dict]:
        """
        Fetch device status (online/offline, battery, GSM signal).
        """
        data = self._make_request('GET', f'/device/{device_identifier}/status')
        if not data:
            return None

        return {
            'device_id': device_identifier,
            'online': data.get('online', False),
            'battery': data.get('battery', 0),
            'gsm_signal': self._map_gsm_signal(data.get('signalStrength', 0)),
            'last_seen': data.get('lastOnline'),
        }

    def _normalize_location(self, raw_location: dict, device_identifier: str) -> Optional[dict]:
        """
        Convert SinoTrack raw GPS response into SmartBus normalized format.

        SinoTrack ST-901A typical response fields:
        - lat/latitude, lng/longitude
        - speed (may be in knots or km/h depending on config)
        - heading/course/bearing
        - timestamp/time/dateTime
        - online/status
        - signal/signalStrength (GSM)
        """
        try:
            lat = float(raw_location.get('lat', raw_location.get('latitude', 0)))
            lng = float(raw_location.get('lng', raw_location.get('longitude', raw_location.get('lon', 0))))

            if lat == 0 and lng == 0:
                return None

            speed_raw = float(raw_location.get('speed', 0))
            # SinoTrack may report speed in knots; convert to km/h if needed
            if speed_raw > 0 and speed_raw < 200:
                speed_kmh = speed_raw * 1.852 if speed_raw < 120 else speed_raw
            else:
                speed_kmh = speed_raw

            heading_raw = float(raw_location.get('heading', raw_location.get('course', raw_location.get('bearing', 0))))

            is_online = raw_location.get('online', raw_location.get('status', 'offline'))
            if isinstance(is_online, str):
                is_online = is_online.lower() in ('online', 'true', '1', 'yes')

            timestamp = raw_location.get('timestamp', raw_location.get('time', raw_location.get('dateTime')))
            if timestamp:
                if isinstance(timestamp, str):
                    try:
                        last_updated = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except (ValueError, AttributeError):
                        last_updated = django_timezone.now()
                elif isinstance(timestamp, (int, float)):
                    last_updated = datetime.fromtimestamp(timestamp, tz=timezone.utc)
                else:
                    last_updated = django_timezone.now()
            else:
                last_updated = django_timezone.now()

            return {
                'device_id': device_identifier,
                'bus_id': '',  # Will be mapped by caller using GPSDevice.assigned_bus
                'latitude': round(lat, 6),
                'longitude': round(lng, 6),
                'speed': round(speed_kmh, 1),
                'heading': round(heading_raw, 1),
                'gps_status': 'online' if is_online else 'offline',
                'gsm_signal': self._map_gsm_signal(raw_location.get('signalStrength', raw_location.get('signal', 0))),
                'last_updated': last_updated.isoformat(),
            }

        except (ValueError, TypeError) as e:
            logger.error(f"Failed to normalize SinoTrack location for {device_identifier}: {e}")
            return None

    @staticmethod
    def _map_gsm_signal(strength) -> str:
        """Map numeric GSM signal strength to readable string."""
        try:
            val = int(strength)
        except (ValueError, TypeError):
            val = 0

        if val >= 20:
            return 'excellent'
        elif val >= 15:
            return 'good'
        elif val >= 10:
            return 'fair'
        elif val > 0:
            return 'poor'
        return 'no_signal'


def get_sinotrack_service() -> SinoTrackService:
    """Factory function to get configured SinoTrack service instance."""
    return SinoTrackService()
