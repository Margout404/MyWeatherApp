const toggleSwitch = document.querySelector('input[type="checkbox"]');
const toggleIcon = document.getElementById('toggle-icon');

// Dark mode toggle
function darkMode() {
  toggleIcon.children[0].textContent = '';
  toggleIcon.children[1].classList.replace('fa-sun', 'fa-moon');
}
// Light mode toggle
function lightMode() {
  toggleIcon.children[0].textContent = '';
  toggleIcon.children[1].classList.replace('fa-moon', 'fa-sun');
}

// Change theme and save to localStorage
function switchTheme(event) {
  if (event.target.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    darkMode(); //apply dark mode UI
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    lightMode(); //apply light mode UI
    localStorage.setItem('theme', 'light');
  }
}

toggleSwitch.addEventListener('change', switchTheme);

const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
  document.documentElement.setAttribute('data-theme', currentTheme);
  if (currentTheme === 'dark') {
    toggleSwitch.checked = true;
    darkMode();
  }
}
// text and icons for later use in the code, compatible with the API and the weather code
const weatherDescriptions = {
  0: { text: "Clear sky", icon: "☀️" },
  1: { text: "Mainly clear", icon: "🌤️" },
  2: { text: "Partly cloudy", icon: "⛅" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Depositing rime fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Moderate drizzle", icon: "🌦️" },
  55: { text: "Dense drizzle", icon: "🌧️" },
  61: { text: "Slight rain", icon: "🌧️" },
  63: { text: "Moderate rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  71: { text: "Snow fall", icon: "❄️" },
  80: { text: "Rain showers", icon: "🌦️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
};
// API url
const apiURL =
  "https://api.open-meteo.com/v1/forecast?latitude=40.6436&longitude=22.9309&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,wind_direction_10m,surface_pressure,weather_code,apparent_temperature&timezone=auto";

// fetch(apiURL)
//   .then((response) => response.json())
//   .then((data) => {
//     showNow(data);

//     document.getElementById("now").addEventListener("click", () => showNow(data));
//     document.getElementById("today").addEventListener("click", () => showToday(data));
//     document.getElementById("select-date").addEventListener("click", () => showDatePicker(data));
//   });


// Fetch weather data and init UI
(async () => {
  try {
    const response = await fetch(apiURL); //request
    const data = await response.json();   //response
    showNow(data);  //render
    bindButtonEvents(data); //connect the buttons
  } catch (error) {
    console.error("Error loading weather data:", error);
    document.getElementById("weather-info").innerHTML = "<p>Failed to load data</p>";
  }
})();


// --------------- Aggregation ------------------

// Aggregate hourly data for one day
function calculateAggregatesForDay(data, targetDate) {
  const results = {
    temperature: [],
    feelsLike: [],
    wind: [],
    gust: [],
    direction: [],
    humidity: [],
    pressure: [],
  };

  // Filter data for the target day
  for (let i = 0; i < data.hourly.time.length; i++) {
    if (data.hourly.time[i].startsWith(targetDate)) {
      results.temperature.push(data.hourly.temperature_2m[i]);
      results.feelsLike.push(data.hourly.apparent_temperature[i]);
      results.wind.push(data.hourly.wind_speed_10m[i]);
      results.gust.push(data.hourly.wind_gusts_10m[i]);
      results.direction.push(data.hourly.wind_direction_10m[i]);
      results.humidity.push(data.hourly.relative_humidity_2m[i]);
      results.pressure.push(data.hourly.surface_pressure[i]);
    }
  }

  // Calculate averages
  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const max = (arr) => Math.max(...arr);
  const mode = (arr) => {
    const counts = {};
    arr.forEach((val) => {
      const rounded = Math.round(val / 10) * 10;
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    return parseInt(
      Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
    );
  };

  return {
    temperature: average(results.temperature).toFixed(1),
    feelsLike: average(results.feelsLike).toFixed(1),
    wind: max(results.wind),
    gust: max(results.gust),
    direction: mode(results.direction),
    humidity: max(results.humidity),
    pressure: max(results.pressure),
  };
}

// ----------------- Views -------------------

// Show current weather
function showNow(data) {
  const currentHour = new Date().getHours();
  const temp = data.hourly.temperature_2m[currentHour];
  const feelsLike = data.hourly.apparent_temperature[currentHour];
  const wind = data.hourly.wind_speed_10m[currentHour];
  const humidity = data.hourly.relative_humidity_2m[currentHour];
  const pressure = data.hourly.surface_pressure[currentHour]/1000; // Convert hPa to kPa
  const weatherCode = data.hourly.weather_code[currentHour];
  const gust = data.hourly.wind_gusts_10m[currentHour];
  const direction = data.hourly.wind_direction_10m[currentHour];
  const weatherText = weatherDescriptions[weatherCode]?.text || "Unknown";
  const weatherIcon = weatherDescriptions[weatherCode]?.icon || "❔";

  const weatherInfo = document.getElementById("weather-info");

  weatherInfo.innerHTML = `
    <h3 id = "now-weather">${weatherIcon} ${weatherText} ${temp} °C</h3>
    <div id="buttons">
      <button id="now">Now</button>
      <button id="today">Today</button>
      <button id="select-date">Select Date</button>
    </div>
    <div class="weather-info-grid">
      <div class="weather-tile"><strong>Temp:</strong><br>${temp} °C</div>
      <div class="weather-tile"><strong>Feels Like:</strong><br>${feelsLike} °C</div>
      <div class="weather-tile"><strong>Wind:</strong><br>${wind} km/h</div>
      <div class="weather-tile"><strong>Wind Gust:</strong><br>${gust} km/h</div>
      <div class="weather-tile"><strong>Dominant Dir:</strong><br>${direction}°</div>
      <div class="weather-tile"><strong>Humidity:</strong><br>${humidity}%</div>
      <div class="weather-tile"><strong>Pressure:</strong><br>${pressure} kPa</div>
    </div>
  `;

  bindButtonEvents(data);

  const canvas = document.createElement("canvas");
canvas.id = "myChart";
canvas.style.maxWidth = "600px";
canvas.style.width = "100%";
canvas.style.marginTop = "2rem";
weatherInfo.appendChild(canvas);

const labels = data.daily.time; // dates
const temps = data.daily.temperature_2m_max.map((t, i) => ({
  x: labels[i],
  y: t
}));

new Chart(canvas, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Max Temperature (°C)",
        data: temps.map(d => d.y),
        backgroundColor: "rgba(255, 205, 86, 0.2)",
        borderColor: "rgba(255, 205, 86, 1)",
        borderWidth: 2,
        tension: 0.4
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: {
        grid: {
          color: 'rgba(200, 200, 200, 0.2)' 
        },
        ticks: {
          color: '#ccc' 
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)' 
        },
        ticks: {
          color: '#ccc' 
        }
      }
    },
  },
});
}

// ----------------- Today -------------------

function showToday(data) {
  const today = new Date().toISOString().split("T")[0];
  const aggregates = calculateAggregatesForDay(data, today);

  const weatherInfo = document.getElementById("weather-info");
  weatherInfo.innerHTML = `
    <h3>📊 Today's Aggregated Weather</h3>
    <div id="buttons">
      <button id="now">Now</button>
      <button id="today">Today</button>
      <button id="select-date">Select Date</button>
    </div>
    <div class="weather-info-grid">
      <div class="weather-tile"><strong>Avg Temp:</strong><br>${aggregates.temperature} °C</div>
      <div class="weather-tile"><strong>Avg Feels Like:</strong><br>${aggregates.feelsLike} °C</div>
      <div class="weather-tile"><strong>Max Wind:</strong><br>${aggregates.wind} km/h</div>
      <div class="weather-tile"><strong>Max Gust:</strong><br>${aggregates.gust} km/h</div>
      <div class="weather-tile"><strong>Dominant Dir:</strong><br>${aggregates.direction}°</div>
      <div class="weather-tile"><strong>Max Humidity:</strong><br>${aggregates.humidity}%</div>
      <div class="weather-tile"><strong>Max Pressure:</strong><br>${aggregates.pressure/1000} kPa</div>
    </div>
  `;

  bindButtonEvents(data);

  const canvas = document.createElement("canvas");
  canvas.id = "myChart";
  canvas.style.maxWidth = "600px";
  canvas.style.width = "100%";
  canvas.style.marginTop = "2rem";
  weatherInfo.appendChild(canvas);

  const labels = data.hourly.time
    .filter((t) => t.startsWith(today))
    .map((t) => t.split("T")[1].slice(0, 5));
  const temps = data.hourly.temperature_2m.filter((_, i) =>
    data.hourly.time[i].startsWith(today)
  );

  new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temps,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: {
            color: 'rgba(200, 200, 200, 0.2)' 
          },
          ticks: {
            color: '#ccc' 
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(200, 200, 200, 0.2)' 
          },
          ticks: {
            color: '#ccc' 
          }
        }
      },
    },
  });
}

// --------------- Date Picker ------------------
function showDatePicker(data) {
    const weatherInfo = document.getElementById("weather-info");

    // take the min and max dates
    const minDate = data.daily.time[0];
    const maxDate = data.daily.time[6]; // 7th day
    
    weatherInfo.innerHTML = `
      <h3>📅 Select a Date</h3>
      <div id="buttons">
        <button id="now">Now</button>
        <button id="today">Today</button>
        <button id="select-date">Select Date</button>
      </div>
      <input type="date" id="date-picker" min="${minDate}" max="${maxDate}" />
      <div id="selected-day-weather"></div>
    `;

  bindButtonEvents(data);

  document.getElementById("date-picker").addEventListener("change", (e) => {
    const selectedDate = e.target.value;
    const aggregates = calculateAggregatesForDay(data, selectedDate);

    document.getElementById("selected-day-weather").innerHTML = `
      <div class="weather-info-grid">
        <div class="weather-tile"><strong>Avg Temp:</strong><br>${aggregates.temperature} °C</div>
        <div class="weather-tile"><strong>Avg Feels Like:</strong><br>${aggregates.feelsLike} °C</div>
        <div class="weather-tile"><strong>Max Wind:</strong><br>${aggregates.wind} km/h</div>
        <div class="weather-tile"><strong>Max Gust:</strong><br>${aggregates.gust} km/h</div>
        <div class="weather-tile"><strong>Dominant Dir:</strong><br>${aggregates.direction}°</div>
        <div class="weather-tile"><strong>Max Humidity:</strong><br>${aggregates.humidity}%</div>
        <div class="weather-tile"><strong>Max Pressure:</strong><br>${aggregates.pressure/1000} kPa</div>
      </div>
    `;
  });
}

// Re-attach event listeners (after DOM updates)
function bindButtonEvents(data) {
  document.getElementById("now").addEventListener("click", () => showNow(data));
  document.getElementById("today").addEventListener("click", () => showToday(data));
  document.getElementById("select-date").addEventListener("click", () => showDatePicker(data));
}

