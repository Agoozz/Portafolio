const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
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
const body = document.body;

// Subtitle Elements
const feelsLikeDescEl = document.getElementById('feels-like-desc');
const humidityDescEl = document.getElementById('humidity-desc');
const windDescEl = document.getElementById('wind-desc');

// Mapa de Clima WMO
const weatherMap = {
    0: { desc: 'Despejado', icon: 'ph-sun', type: 'sunny' },
    1: { desc: 'Mayormente Despejado', icon: 'ph-sun-dim', type: 'sunny' },
    2: { desc: 'Parcialmente Nublado', icon: 'ph-cloud-sun', type: 'cloudy' },
    3: { desc: 'Nublado', icon: 'ph-cloud', type: 'cloudy' },
    45: { desc: 'Niebla', icon: 'ph-cloud-fog', type: 'cloudy' },
    48: { desc: 'Niebla de Escarcha', icon: 'ph-cloud-fog', type: 'cloudy' },
    51: { desc: 'Llovizna Ligera', icon: 'ph-cloud-rain', type: 'rainy' },
    53: { desc: 'Llovizna Moderada', icon: 'ph-cloud-rain', type: 'rainy' },
    55: { desc: 'Llovizna Densa', icon: 'ph-cloud-rain', type: 'rainy' },
    61: { desc: 'Lluvia Ligera', icon: 'ph-cloud-rain', type: 'rainy' },
    63: { desc: 'Lluvia Moderada', icon: 'ph-cloud-rain', type: 'rainy' },
    65: { desc: 'Lluvia Fuerte', icon: 'ph-cloud-lightning', type: 'storm' },
    71: { desc: 'Nieve Ligera', icon: 'ph-snowflake', type: 'snowy' },
    73: { desc: 'Nieve Moderada', icon: 'ph-snowflake', type: 'snowy' },
    75: { desc: 'Nieve Fuerte', icon: 'ph-snowflake', type: 'snowy' },
    80: { desc: 'Chubascos Ligeros', icon: 'ph-cloud-rain', type: 'rainy' },
    81: { desc: 'Chubascos Fuertes', icon: 'ph-cloud-rain', type: 'rainy' },
    82: { desc: 'Chubascos Violentos', icon: 'ph-cloud-lightning', type: 'storm' },
    95: { desc: 'Tormenta', icon: 'ph-cloud-lightning', type: 'storm' },
    96: { desc: 'Tormenta con Granizo', icon: 'ph-cloud-lightning', type: 'storm' },
    99: { desc: 'Tormenta Fuerte con Granizo', icon: 'ph-cloud-lightning', type: 'storm' }
};

searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
    const query = cityInput.value.trim();
    if (!query) return;

    showStatus('<i class="ph ph-spinner-gap spin"></i> Buscando ciudad...');

    try {
        // 1. Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('No encontramos esa ciudad. (Ej: Córdoba Argentina).');
        }

        const locationData = geoData.results[0];
        const { latitude, longitude, name } = locationData;

        showStatus('<i class="ph ph-spinner-gap spin"></i> Obteniendo clima...');

        // 2. Weather Data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        // 3. Foto de Wikipedia
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
        showStatus(`<i class="ph ph-warning-circle"></i> ${error.message}`);
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
    
    // Iconos de Día/Noche
    let iconClass = weatherInfo.icon;
    if (iconClass === 'ph-sun' && !isDay) iconClass = 'ph-moon';
    if (iconClass === 'ph-cloud-sun' && !isDay) iconClass = 'ph-cloud-moon';

    // Rellenar Datos
    cityNameEl.innerText = locationData.name;
    const state = locationData.admin1 ? `${locationData.admin1}, ` : '';
    cityLocationEl.innerText = `${state}${locationData.country}`;
    
    // Bandera con API Externa (Funciona siempre en Windows)
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

    // Manejar Imagen de Wikipedia (Evitar fondo negro si no hay foto)
    if (imageUrl) {
        cityImageEl.src = imageUrl;
        cityImageEl.classList.remove('hidden');
        cityBannerOverlayEl.classList.remove('hidden'); // Mostrar oscurecimiento
    } else {
        cityImageEl.classList.add('hidden');
        cityBannerOverlayEl.classList.add('hidden'); // Ocultar oscurecimiento para dejar pasar el Glassmorphism puro
    }

    // Actualizar Subtítulos Descriptivos
    updateSubtitles(temp, feelsLike, humidity, wind);

    // Actualizar Fondo Dinámico
    updateBackground(weatherInfo.type, isDay);

    // Actualizar Insight
    recommendationTextEl.innerText = getInsight(temp, weatherInfo.type, wind);

    // Animación
    weatherWidget.classList.remove('hidden');
    weatherWidget.style.animation = 'none';
    weatherWidget.offsetHeight; 
    weatherWidget.style.animation = null; 
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

// Inicializar
cityInput.value = "Córdoba Argentina";
handleSearch();
cityInput.value = "";
