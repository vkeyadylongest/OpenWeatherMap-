// API Key - Sign up at https://openweathermap.org to get your own free API key
const API_KEY = '409b614c17024cbf938d967f772a2f4e'; // Replace with your actual API key

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherDescription = document.getElementById('weather-description');
const weatherIcon = document.getElementById('weather-icon');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feels-like');
const forecastContainer = document.getElementById('forecast-container');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherDataByCoords(latitude, longitude);
            },
            error => {
                alert('Unable to retrieve your location. Please enable location services or search manually.');
                console.error(error);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please search manually.');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

// Initialize with default city
window.addEventListener('load', () => {
    getWeatherData('London');
});

// Fetch weather data by city name
async function getWeatherData(city) {
    try {
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentWeatherData, forecastData);
    } catch (error) {
        alert('Error fetching weather data. Please check the city name and try again.');
        console.error('Error:', error);
    }
}

// Fetch weather data by coordinates
async function getWeatherDataByCoords(lat, lon) {
    try {
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentWeatherData, forecastData);
    } catch (error) {
        alert('Error fetching weather data for your location.');
        console.error('Error:', error);
    }
}

// Display weather data
function displayWeatherData(currentData, forecastData) {
    // Current weather
    cityName.textContent = `${currentData.name}, ${currentData.sys.country}`;
    
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    currentTemp.textContent = Math.round(currentData.main.temp);
    weatherDescription.textContent = currentData.weather[0].description;
    
    weatherIcon.src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
    weatherIcon.alt = currentData.weather[0].description;
    
    windSpeed.textContent = Math.round(currentData.wind.speed * 3.6); // Convert m/s to km/h
    humidity.textContent = currentData.main.humidity;
    feelsLike.textContent = Math.round(currentData.main.feels_like);
    
    // Forecast
    forecastContainer.innerHTML = '';
    
    // Group forecast by day (OpenWeatherMap provides forecast for every 3 hours)
    const dailyForecast = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecast[date]) {
            dailyForecast[date] = [];
        }
        dailyForecast[date].push(item);
    });
    
    // Get forecast for next 5 days (excluding today)
    const forecastDates = Object.keys(dailyForecast).slice(1, 6);
    
    forecastDates.forEach(date => {
        const dayData = dailyForecast[date];
        const dayTemp = dayData.reduce((acc, curr) => acc + curr.main.temp, 0) / dayData.length;
        const minTemp = Math.min(...dayData.map(item => item.main.temp_min));
        const maxTemp = Math.max(...dayData.map(item => item.main.temp_max));
        
        // Get most common weather condition for the day
        const weatherCount = {};
        dayData.forEach(item => {
            const condition = item.weather[0].main;
            weatherCount[condition] = (weatherCount[condition] || 0) + 1;
        });
        const mostCommonWeather = Object.keys(weatherCount).reduce((a, b) => 
            weatherCount[a] > weatherCount[b] ? a : b
        );
        const weatherIconCode = dayData.find(item => 
            item.weather[0].main === mostCommonWeather
        ).weather[0].icon;
        
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        
        const forecastDate = new Date(date);
        const dayName = forecastDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        forecastDay.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${weatherIconCode}.png" alt="${mostCommonWeather}">
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(maxTemp)}°</span>
                <span class="min-temp">${Math.round(minTemp)}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastDay);
    });
}