const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const cityInput = document.getElementById('city-input');
const suggestionsList = document.getElementById('suggestions');
const weatherWidget = document.getElementById('weather-widget');
const statusContainer = document.getElementById('status-container');
const statusMsg = document.getElementById('status-msg');

// DOM Elements
const cityNameEl = document.getElementById('city-name');
const cityLocationEl = document.getElementById('city-location');
const flagIconEl = document.getElementById('flag-icon');
const cityImageEl = document.getElementById('city-image');
const cityBannerOverlayEl = document.getElementById('city-banner-overlay');
const weatherDescEl = document.getElementById('weather-desc');
const temperatureEl = document.getElementById('temperature');
const tempMinEl = document.getElementById('temp-min');
const tempMaxEl = document.getElementById('temp-max');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const weatherIconEl = document.getElementById('weather-icon');
const recommendationTextEl = document.getElementById('recommendation-text');
const forecastScrollEl = document.getElementById('forecast-scroll');
const body = document.body;

// Subtitles
const feelsLikeDescEl = document.getElementById('feels-like-desc');
const humidityDescEl = document.getElementById('humidity-desc');
const windDescEl = document.getElementById('wind-desc');

// Mapa de Clima WMO
const weatherMap = {
    0: { desc: 'Despejado', icon: 'ph-sun', type: 'sunny' },
    1: { desc: 'M. Despejado', icon: 'ph-sun-dim', type: 'sunny' },
    2: { desc: 'P. Nublado', icon: 'ph-cloud-sun', type: 'cloudy' },
    3: { desc: 'Nublado', icon: 'ph-cloud', type: 'cloudy' },
    45: { desc: 'Niebla', icon: 'ph-cloud-fog', type: 'cloudy' },
    48: { desc: 'Escarcha', icon: 'ph-cloud-fog', type: 'cloudy' },
    51: { desc: 'Llovizna L.', icon: 'ph-cloud-rain', type: 'rainy' },
    53: { desc: 'Llovizna M.', icon: 'ph-cloud-rain', type: 'rainy' },
    55: { desc: 'Llovizna F.', icon: 'ph-cloud-rain', type: 'rainy' },
    61: { desc: 'Lluvia Lig.', icon: 'ph-cloud-rain', type: 'rainy' },
    63: { desc: 'Lluvia Mod.', icon: 'ph-cloud-rain', type: 'rainy' },
    65: { desc: 'Lluvia Fue.', icon: 'ph-cloud-lightning', type: 'storm' },
    71: { desc: 'Nieve Lig.', icon: 'ph-snowflake', type: 'snowy' },
    73: { desc: 'Nieve Mod.', icon: 'ph-snowflake', type: 'snowy' },
    75: { desc: 'Nieve Fue.', icon: 'ph-snowflake', type: 'snowy' },
    80: { desc: 'Chubascos L.', icon: 'ph-cloud-rain', type: 'rainy' },
    81: { desc: 'Chubascos F.', icon: 'ph-cloud-rain', type: 'rainy' },
    82: { desc: 'Violentos', icon: 'ph-cloud-lightning', type: 'storm' },
    95: { desc: 'Tormenta', icon: 'ph-cloud-lightning', type: 'storm' },
    96: { desc: 'Tormenta/Gra', icon: 'ph-cloud-lightning', type: 'storm' },
    99: { desc: 'Torm. Fuerte', icon: 'ph-cloud-lightning', type: 'storm' }
};

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ==========================================
// 1. AUTOCOMPLETADO (Debounce)
// ==========================================
let debounceTimer;
cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 3) {
        suggestionsList.classList.add('hidden');
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, 400); // 400ms debounce
});

async function fetchSuggestions(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
        const data = await res.json();
        
        suggestionsList.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(city => {
                const li = document.createElement('li');
                const admin = city.admin1 ? `${city.admin1}, ` : '';
                const flagSrc = city.country_code ? `https://flagcdn.com/w20/${city.country_code.toLowerCase()}.png` : '';
                
                li.innerHTML = `
                    ${flagSrc ? `<img src="${flagSrc}" class="sugg-flag">` : '🏳️'}
                    <div>
                        <div class="sugg-title">${city.name}</div>
                        <div class="sugg-desc">${admin}${city.country}</div>
                    </div>
                `;
                
                li.addEventListener('click', () => {
                    cityInput.value = city.name;
                    suggestionsList.classList.add('hidden');
                    loadWeatherForLocation(city);
                });
                
                suggestionsList.appendChild(li);
            });
            suggestionsList.classList.remove('hidden');
        } else {
            suggestionsList.classList.add('hidden');
        }
    } catch (e) {
        suggestionsList.classList.add('hidden');
    }
}

// Ocultar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add('hidden');
    }
});


// ==========================================
// 2. GEOLOCALIZACIÓN (Botón GPS)
// ==========================================
geoBtn.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        showStatus('<i class="ph ph-spinner-gap spin"></i> Obteniendo coordenadas GPS...');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                showStatus('<i class="ph ph-spinner-gap spin"></i> Identificando tu ciudad...');
                
                try {
                    // Reverse Geocoding usando BigDataCloud (Gratis, sin API Key)
                    const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
                    const reverseData = await reverseRes.json();
                    
                    const locationData = {
                        latitude: lat,
                        longitude: lon,
                        name: reverseData.city || reverseData.locality || "Tu Ubicación",
                        admin1: reverseData.principalSubdivision,
                        country: reverseData.countryName,
                        country_code: reverseData.countryCode
                    };
                    
                    cityInput.value = locationData.name;
                    loadWeatherForLocation(locationData);
                    
                } catch (e) {
                    showStatus(`<i class="ph ph-warning-circle"></i> Error identificando ubicación.`);
                }
            },
            (error) => {
                showStatus(`<i class="ph ph-warning-circle"></i> Activa los permisos de ubicación en tu navegador.`);
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
});


// ==========================================
// Búsqueda Manual
// ==========================================
searchBtn.addEventListener('click', handleManualSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        suggestionsList.classList.add('hidden');
        handleManualSearch();
    }
});

async function handleManualSearch() {
    const query = cityInput.value.trim();
    if (!query) return;

    showStatus('<i class="ph ph-spinner-gap spin"></i> Buscando ciudad...');
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('No encontramos esa ciudad. (Ej: Córdoba Argentina).');
        }
        loadWeatherForLocation(geoData.results[0]);
    } catch (error) {
        showStatus(`<i class="ph ph-warning-circle"></i> ${error.message}`);
    }
}


// ==========================================
// Carga de Clima y Renderizado
// ==========================================
async function loadWeatherForLocation(locationData) {
    showStatus('<i class="ph ph-spinner-gap spin"></i> Obteniendo clima...');
    try {
        const { latitude, longitude, name } = locationData;

        // Fallback robusto para la zona horaria (Evita el fallo de 'auto' en Open-Meteo)
        const tz = locationData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';

        // Weather Data (Ahora extraemos 7 días completos)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=time,weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(tz)}`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        if (weatherData.error) {
            throw new Error(weatherData.reason || "Error devuelto por la API del clima.");
        }

        // Foto de Wikipedia
        let cityImageUrl = '';
        try {
            const wikiRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
            if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                if (wikiData.thumbnail && wikiData.thumbnail.source) {
                    cityImageUrl = wikiData.thumbnail.source;
                }
            }
        } catch (e) {}

        updateUI(locationData, weatherData, cityImageUrl);
        hideStatus();

    } catch (error) {
        console.error(error);
        showStatus(`<i class="ph ph-warning-circle"></i> Error: ${error.message}`);
    }
}

function updateUI(locationData, weatherData, imageUrl) {
    const current = weatherData.current;
    const daily = weatherData.daily;

    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const wind = Math.round(current.wind_speed_10m);
    const isDay = current.is_day;
    const code = current.weather_code;
    
    const min = Math.round(daily.temperature_2m_min[0]);
    const max = Math.round(daily.temperature_2m_max[0]);

    const weatherInfo = weatherMap[code] || { desc: 'Desconocido', icon: 'ph-cloud', type: 'cloudy' };
    
    let iconClass = weatherInfo.icon;
    if (iconClass === 'ph-sun' && !isDay) iconClass = 'ph-moon';
    if (iconClass === 'ph-cloud-sun' && !isDay) iconClass = 'ph-cloud-moon';

    // Rellenar Datos Actuales
    cityNameEl.innerText = locationData.name;
    const state = locationData.admin1 ? `${locationData.admin1}, ` : '';
    cityLocationEl.innerText = `${state}${locationData.country}`;
    
    if(locationData.country_code) {
        flagIconEl.src = `https://flagcdn.com/w40/${locationData.country_code.toLowerCase()}.png`;
        flagIconEl.classList.remove('hidden');
    } else {
        flagIconEl.classList.add('hidden');
    }

    weatherDescEl.innerText = weatherInfo.desc;
    temperatureEl.innerText = temp;
    tempMinEl.innerText = min;
    tempMaxEl.innerText = max;
    feelsLikeEl.innerText = feelsLike;
    humidityEl.innerText = humidity;
    windEl.innerText = wind;
    
    weatherIconEl.className = `ph-fill ${iconClass} weather-icon-large`;
    if (weatherInfo.type === 'sunny' && isDay) weatherIconEl.style.color = '#fbbf24';
    else if (weatherInfo.type === 'cloudy') weatherIconEl.style.color = '#e2e8f0';
    else if (weatherInfo.type === 'rainy' || weatherInfo.type === 'storm') weatherIconEl.style.color = '#93c5fd';
    else if (weatherInfo.type === 'snowy') weatherIconEl.style.color = '#ffffff';
    else weatherIconEl.style.color = '#f8fafc';

    // Imagen de Wikipedia
    if (imageUrl) {
        cityImageEl.src = imageUrl;
        cityImageEl.classList.remove('hidden');
        cityBannerOverlayEl.classList.remove('hidden'); 
    } else {
        cityImageEl.classList.add('hidden');
        cityBannerOverlayEl.classList.add('hidden'); 
    }

    updateSubtitles(temp, feelsLike, humidity, wind);
    updateBackground(weatherInfo.type, isDay);
    recommendationTextEl.innerText = getInsight(temp, weatherInfo.type, wind);
    
    // ==========================================
    // 3. RENDERIZAR PRONÓSTICO 7 DÍAS
    // ==========================================
    renderForecast(daily);

    weatherWidget.classList.remove('hidden');
    weatherWidget.style.animation = 'none';
    weatherWidget.offsetHeight; 
    weatherWidget.style.animation = null; 
}

function renderForecast(daily) {
    forecastScrollEl.innerHTML = '';
    
    // El array de open-meteo suele traer 7 días. Empezamos desde el index 1 (mañana) o 0 (hoy)
    // Mostraremos desde hoy hasta el día 6
    for(let i = 0; i < 7; i++) {
        const dateStr = daily.time[i]; // "2023-10-15"
        const d = new Date(dateStr + "T12:00:00"); // Forzar mediodía para evitar saltos de zona horaria
        let dayName = i === 0 ? "Hoy" : daysOfWeek[d.getDay()];
        
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        
        const info = weatherMap[code] || { icon: 'ph-cloud', type: 'cloudy' };
        
        // Color del iconito en el pronóstico
        let iconColor = '#ffffff';
        if (info.type === 'sunny') iconColor = '#fbbf24';
        else if (info.type === 'rainy' || info.type === 'storm') iconColor = '#93c5fd';

        const cardHTML = `
            <div class="forecast-card">
                <span class="fc-day">${dayName}</span>
                <i class="ph-fill ${info.icon} fc-icon" style="color: ${iconColor};"></i>
                <div class="fc-temps">
                    <span class="fc-max">${max}°</span>
                    <span class="fc-min">${min}°</span>
                </div>
            </div>
        `;
        forecastScrollEl.innerHTML += cardHTML;
    }
}

function updateSubtitles(temp, feelsLike, humidity, wind) {
    if (feelsLike === temp) feelsLikeDescEl.innerText = "Similar a la real";
    else if (feelsLike > temp) feelsLikeDescEl.innerText = "Se siente más calor";
    else feelsLikeDescEl.innerText = "Se siente más frío";

    if (humidity < 30) humidityDescEl.innerText = "Baja (Seco)";
    else if (humidity >= 30 && humidity <= 60) humidityDescEl.innerText = "Normal";
    else humidityDescEl.innerText = "Alta (Húmedo)";

    if (wind < 5) windDescEl.innerText = "Calma";
    else if (wind >= 5 && wind < 15) windDescEl.innerText = "Brisa ligera";
    else if (wind >= 15 && wind < 30) windDescEl.innerText = "Viento moderado";
    else windDescEl.innerText = "Viento fuerte";
}

function updateBackground(type, isDay) {
    body.className = '';
    if (!isDay) { body.classList.add('sky-night'); return; }

    if (type === 'sunny') body.classList.add('sky-sunny');
    else if (type === 'cloudy') body.classList.add('sky-cloudy');
    else if (type === 'rainy' || type === 'storm') body.classList.add('sky-rainy');
    else if (type === 'snowy') body.classList.add('sky-snowy');
    else body.classList.add('sky-default');
}

function showStatus(html) {
    weatherWidget.classList.add('hidden');
    statusContainer.classList.remove('hidden');
    statusMsg.innerHTML = html;
}
function hideStatus() { statusContainer.classList.add('hidden'); }

function getInsight(temp, weatherType, windSpeed) {
    if (weatherType === 'rainy') return "Lluvia a la vista. Un paraguas o impermeable son indispensables hoy.";
    if (weatherType === 'storm') return "Tormenta activa. Mantente en interiores y desconecta aparatos sensibles si puedes.";
    if (weatherType === 'snowy') return "Temperaturas bajo cero y nieve. Vístete en capas gruesas y cuida tus extremidades.";
    
    if (temp >= 32) return "Calor extremo. Evita el sol directo en horas pico y mantente muy hidratado.";
    if (temp >= 25) return "El clima está cálido. Ideal para ropa ligera y protector solar.";
    if (temp >= 15) return "Temperatura agradable. Un buen clima para estar al aire libre.";
    if (temp >= 5)  return "Hace bastante frío. Necesitarás una campera gruesa antes de salir.";
    return "Fuerte helada. Usa bufanda, guantes y gorro para protegerte.";
}

// Inicializar con la capital (o la última buscada)
cityInput.value = "Buenos Aires";
handleManualSearch();
cityInput.value = "";
