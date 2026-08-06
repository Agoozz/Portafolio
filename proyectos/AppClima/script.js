const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
const errorCard = document.getElementById('error-card');
const loader = document.getElementById('loader');

// DOM Elements inside weather card
const cityNameEl = document.getElementById('city-name');
const weatherDescEl = document.getElementById('weather-desc');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const weatherIconEl = document.getElementById('weather-icon');
const recommendationTextEl = document.getElementById('recommendation-text');
const secondaryGlow = document.querySelector('.bg-glow.secondary');

// WMO Weather interpretation codes (Open-Meteo)
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

// Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    // Show loader
    weatherCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        // 1. Get Coordinates from city name
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Ciudad no encontrada');
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country } = location;

        // 2. Get Weather data
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m`);
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;

        // Update UI
        updateUI(name, country, current);

        loader.classList.add('hidden');
        weatherCard.classList.remove('hidden');

    } catch (error) {
        loader.classList.add('hidden');
        errorCard.classList.remove('hidden');
    }
}

function updateUI(city, country, currentData) {
    const temp = Math.round(currentData.temperature_2m);
    const humidity = currentData.relative_humidity_2m;
    const wind = currentData.wind_speed_10m;
    const isDay = currentData.is_day;
    const code = currentData.weather_code;

    // Get Weather Info from Map
    const weatherInfo = weatherMap[code] || { desc: 'Desconocido', icon: 'ph-cloud', type: 'cloudy' };
    
    // Day/Night adjustments
    let iconClass = weatherInfo.icon;
    if (iconClass === 'ph-sun' && !isDay) iconClass = 'ph-moon';
    if (iconClass === 'ph-cloud-sun' && !isDay) iconClass = 'ph-cloud-moon';

    // Populate DOM
    cityNameEl.innerText = `${city}, ${country}`;
    weatherDescEl.innerText = weatherInfo.desc;
    temperatureEl.innerText = temp;
    humidityEl.innerText = `${humidity}%`;
    windEl.innerText = `${wind} km/h`;
    
    weatherIconEl.className = `ph ${iconClass} weather-icon-large`;

    // Apply colors based on weather type
    if(weatherInfo.type === 'sunny' && isDay) {
        weatherIconEl.style.color = '#f59e0b';
        secondaryGlow.style.background = 'rgba(245, 158, 11, 0.15)';
    } else if (weatherInfo.type === 'rainy' || weatherInfo.type === 'storm') {
        weatherIconEl.style.color = '#3b82f6';
        secondaryGlow.style.background = 'rgba(59, 130, 246, 0.15)';
    } else if (weatherInfo.type === 'snowy') {
        weatherIconEl.style.color = '#cbd5e1';
        secondaryGlow.style.background = 'rgba(203, 213, 225, 0.15)';
    } else {
        weatherIconEl.style.color = '#a8a8b3';
        secondaryGlow.style.background = 'rgba(168, 168, 179, 0.15)';
    }

    // Generate Smart Recommendation
    recommendationTextEl.innerText = getRecommendation(temp, weatherInfo.type, wind);
}

// Lógica del Motor de Recomendaciones (Lo pedido por el usuario)
function getRecommendation(temp, weatherType, windSpeed) {
    let rec = "";

    // Lógica principal basada en el tipo de clima
    if (weatherType === 'rainy') {
        rec = "Día lluvioso. 🌧️ Asegúrate de llevar un buen paraguas, usar calzado resistente al agua y, si conduces, hazlo con mucha precaución porque el asfalto estará resbaladizo.";
    } else if (weatherType === 'storm') {
        rec = "¡Alerta de Tormenta! ⚡ Lo mejor es quedarse en casa si es posible. Desconecta equipos electrónicos sensibles y evita lugares abiertos.";
    } else if (weatherType === 'snowy') {
        rec = "¡Está nevando! ❄️ Abrígate con capas térmicas, usa guantes y botas antideslizantes. Ideal para un chocolate caliente adentro.";
    } else {
        // Si no llueve ni nieva, evaluamos la temperatura
        if (temp >= 30) {
            rec = "¡Hace mucho calor! ☀️ Usa protector solar (FPS 50+), ponte ropa ligera y de colores claros, y no olvides llevar una botella de agua para mantenerte hidratado todo el día.";
        } else if (temp >= 20 && temp < 30) {
            rec = "El clima está ideal. 😎 Es un día perfecto para actividades al aire libre o tomar un café en una terraza. Disfruta el día.";
        } else if (temp >= 10 && temp < 20) {
            rec = "El clima está fresco. 🧥 Te recomiendo llevar una campera ligera o un suéter, especialmente si vas a salir por la tarde-noche.";
        } else {
            rec = "¡Hace mucho frío! 🥶 Es indispensable usar un buen abrigo, bufanda y tal vez guantes. Protege tu cuello y mantente en lugares cálidos.";
        }
    }

    // Añadir advertencia de viento si aplica
    if (windSpeed > 30 && weatherType !== 'storm') {
        rec += " Además, hay mucho viento 🌬️. Ten cuidado con objetos que puedan caer y evita arreglarte mucho el pelo.";
    }

    return rec;
}
