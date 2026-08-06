const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherWidget = document.getElementById('weather-widget');
const statusContainer = document.getElementById('status-container');
const statusMsg = document.getElementById('status-msg');

// DOM Elements
const cityNameEl = document.getElementById('city-name');
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
    const city = cityInput.value.trim();
    if (!city) return;

    showStatus('<i class="ph ph-spinner-gap spin"></i> Buscando...');

    try {
        // 1. Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Ciudad no encontrada.');
        }

        const { latitude, longitude, name } = geoData.results[0];

        // 2. Weather Data (Current + Daily for Min/Max)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        updateUI(name, weatherData);
        hideStatus();

    } catch (error) {
        showStatus(`<i class="ph ph-warning-circle"></i> ${error.message}`);
    }
}

function updateUI(city, data) {
    const current = data.current;
    const daily = data.daily;

    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const wind = current.wind_speed_10m;
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
    cityNameEl.innerText = city;
    weatherDescEl.innerText = weatherInfo.desc;
    temperatureEl.innerText = temp;
    tempMinEl.innerText = min;
    tempMaxEl.innerText = max;
    feelsLikeEl.innerText = feelsLike;
    humidityEl.innerText = humidity;
    windEl.innerText = Math.round(wind);
    
    weatherIconEl.className = `ph ${iconClass} weather-icon-large`;

    // Actualizar Fondo Dinámico (Sky Gradient)
    updateBackground(weatherInfo.type, isDay);

    // Actualizar Insight
    recommendationTextEl.innerText = getInsight(temp, weatherInfo.type, wind);

    // Mostrar el widget (re-trigger de la animación)
    weatherWidget.classList.remove('hidden');
    weatherWidget.style.animation = 'none';
    weatherWidget.offsetHeight; // trigger reflow
    weatherWidget.style.animation = null; 
}

function updateBackground(type, isDay) {
    // Reset classes
    body.className = '';
    
    if (!isDay) {
        body.classList.add('sky-night');
        return;
    }

    // Si es de día
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

function hideStatus() {
    statusContainer.classList.add('hidden');
}

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

// Inicializar con una ciudad por defecto para mostrar algo lindo al entrar
cityInput.value = "Buenos Aires";
handleSearch();
cityInput.value = "";
