(function () {
  const config = window.MAP_GEOCODER_CONFIG || {};
  const provider = config.provider || 'nominatim';

  function toQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, value);
    });
    return qs.toString();
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Search service is unavailable right now.');
    }

    return response.json();
  }

  function normalizeNominatim(results) {
    return (Array.isArray(results) ? results : []).map((item) => ({
      label: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon)
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon) && item.label);
  }

  function normalizeGeoapify(results) {
    const features = Array.isArray(results?.features) ? results.features : [];
    return features.map((feature) => ({
      label: feature.properties?.formatted || feature.properties?.address_line1 || 'Unnamed place',
      lat: Number(feature.properties?.lat),
      lon: Number(feature.properties?.lon)
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon) && item.label);
  }

  function buildQuery(rawQuery, options) {
    const query = String(rawQuery || '').trim();
    if (!query) return '';
    if (options.appendContext && !query.toLowerCase().includes(String(options.appendContext).toLowerCase())) {
      return `${query}, ${options.appendContext}`;
    }
    return query;
  }

  function createNominatimClient(options) {
    const baseUrl = config.nominatim?.baseUrl || 'https://nominatim.openstreetmap.org';

    return {
      async suggest(rawQuery) {
        const query = buildQuery(rawQuery, options);
        if (!query) return [];
        const url = `${baseUrl}/search?${toQueryString({
          format: 'jsonv2',
          limit: 5,
          addressdetails: 1,
          countrycodes: options.countryCode || '',
          q: query
        })}`;
        return normalizeNominatim(await fetchJson(url));
      },
      async search(rawQuery) {
        const query = buildQuery(rawQuery, options);
        if (!query) return null;
        const url = `${baseUrl}/search?${toQueryString({
          format: 'jsonv2',
          limit: 1,
          addressdetails: 1,
          countrycodes: options.countryCode || '',
          q: query
        })}`;
        return normalizeNominatim(await fetchJson(url))[0] || null;
      }
    };
  }

  function createGeoapifyClient(options) {
    const apiKey = config.geoapify?.apiKey;
    if (!apiKey) {
      return createNominatimClient(options);
    }

    const endpointBase = 'https://api.geoapify.com/v1/geocode';
    const filter = options.countryCode ? `countrycode:${options.countryCode}` : '';

    return {
      async suggest(rawQuery) {
        const query = buildQuery(rawQuery, options);
        if (!query) return [];
        const url = `${endpointBase}/autocomplete?${toQueryString({
          text: query,
          limit: 5,
          filter,
          format: 'json',
          apiKey
        })}`;
        return normalizeGeoapify(await fetchJson(url));
      },
      async search(rawQuery) {
        const query = buildQuery(rawQuery, options);
        if (!query) return null;
        const url = `${endpointBase}/search?${toQueryString({
          text: query,
          limit: 1,
          filter,
          format: 'json',
          apiKey
        })}`;
        return normalizeGeoapify(await fetchJson(url))[0] || null;
      }
    };
  }

  window.createMapGeocoder = function createMapGeocoder(options = {}) {
    if (provider === 'geoapify') {
      return createGeoapifyClient(options);
    }
    return createNominatimClient(options);
  };
})();
