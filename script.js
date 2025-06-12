// 全域變數
let currentAirport = '';
let currentTab = 'realtime';
let currentFlightType = 'arrival';

// API 設定
const API_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Air';
const API_KEY = 'YOUR_API_KEY'; // 請替換成您的 API 金鑰

// 自動更新設定
const AUTO_UPDATE_INTERVAL = 5 * 60 * 1000; // 5分鐘
let autoUpdateTimer = null;

// 初始化頁面
document.addEventListener('DOMContentLoaded', () => {
    initializeAirportButtons();
    initializeTabButtons();
    initializeFlightTypeButtons();
    initializeAirlineSearch();
    startAutoUpdate();
});

// 啟動自動更新
function startAutoUpdate() {
    if (autoUpdateTimer) {
        clearInterval(autoUpdateTimer);
    }
    
    // 立即執行一次更新
    if (currentAirport) {
        updateAirportData();
    }
    
    // 設定定期更新
    autoUpdateTimer = setInterval(() => {
        if (currentAirport) {
            updateAirportData();
        }
    }, AUTO_UPDATE_INTERVAL);
}

// 機場按鈕初始化
function initializeAirportButtons() {
    const airportButtons = document.querySelectorAll('.airport-btn');
    airportButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentAirport = button.dataset.airport;
            updateSelectedAirport(button.textContent);
            updateAirportData();
        });
    });
}

// 功能標籤初始化
function initializeTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentTab = button.dataset.tab;
            updateActiveTab(button);
            updateTabContent();
        });
    });
}

// 航班類型按鈕初始化
function initializeFlightTypeButtons() {
    const flightTypeButtons = document.querySelectorAll('.flight-type-btn');
    flightTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentFlightType = button.dataset.type;
            updateActiveFlightType(button);
            updateFlightData();
        });
    });
}

// 航空公司搜尋初始化
function initializeAirlineSearch() {
    const searchButton = document.getElementById('search-btn');
    searchButton.addEventListener('click', () => {
        const airlineCode = document.getElementById('airline-code').value.toUpperCase();
        searchAirlineFlights(airlineCode);
    });
}

// 更新選中的機場
function updateSelectedAirport(airportName) {
    document.getElementById('selected-airport').textContent = airportName;
    document.querySelectorAll('.airport-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // 重新啟動自動更新
    startAutoUpdate();
}

// 更新活動標籤
function updateActiveTab(selectedTab) {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    selectedTab.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${currentTab}-info`).classList.add('active');
}

// 更新航班類型
function updateActiveFlightType(selectedButton) {
    document.querySelectorAll('.flight-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    selectedButton.classList.add('active');
}

// 更新機場資料
async function updateAirportData() {
    switch(currentTab) {
        case 'realtime':
            await updateFlightData();
            break;
        case 'schedule':
            await updateScheduleData();
            break;
        case 'weather':
            await updateWeatherData();
            break;
    }
}

// 更新航班資料
async function updateFlightData() {
    if (!currentAirport) return;
    
    const endpoint = currentFlightType === 'arrival' ? 'FIDS/Arrival' : 'FIDS/Departure';
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${currentAirport}?$format=JSON`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('API 請求失敗');
        
        const data = await response.json();
        displayFlightData(data);
    } catch (error) {
        console.error('獲取航班資料時發生錯誤:', error);
        displayError('無法載入航班資料');
    }
}

// 更新定期航班資料
async function updateScheduleData() {
    // 實作定期航班查詢邏輯
    const scheduleContainer = document.getElementById('schedule-info');
    scheduleContainer.innerHTML = '<p>定期航班資料載入中...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/Schedule/Station/${currentAirport}?$format=JSON`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('API 請求失敗');
        
        const data = await response.json();
        displayScheduleData(data);
    } catch (error) {
        console.error('獲取定期航班資料時發生錯誤:', error);
        displayError('無法載入定期航班資料');
    }
}

// 搜尋航空公司航班
async function searchAirlineFlights(airlineCode) {
    if (!airlineCode || !currentAirport) return;
    
    const resultsContainer = document.getElementById('airline-results');
    resultsContainer.innerHTML = '<p>搜尋中...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/FIDS/Airline/${currentAirport}/${airlineCode}?$format=JSON`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('API 請求失敗');
        
        const data = await response.json();
        displayAirlineResults(data);
    } catch (error) {
        console.error('搜尋航空公司航班時發生錯誤:', error);
        displayError('無法載入航空公司航班資料');
    }
}

// 更新天氣資料
async function updateWeatherData() {
    const weatherContainer = document.querySelector('.weather-container');
    weatherContainer.innerHTML = '<p>天氣資料載入中...</p>';
    
    // 這裡可以接入天氣 API
    // 使用 OpenWeather API 或其他天氣服務
}

// 顯示航班資料
function displayFlightData(flights) {
    const tableBody = document.getElementById('flight-data');
    tableBody.innerHTML = '';
    
    flights.forEach(flight => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flight.FlightNumber}</td>
            <td>${flight.Airline}</td>
            <td>${currentFlightType === 'arrival' ? flight.DepartureAirport : flight.ArrivalAirport}</td>
            <td>${currentFlightType === 'arrival' ? flight.ScheduledArrivalTime : flight.ScheduledDepartureTime}</td>
            <td>${flight.Terminal || '-'}/${flight.Gate || '-'}</td>
            <td>${getFlightStatus(flight.Status)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 顯示定期航班資料
function displayScheduleData(schedules) {
    const scheduleContainer = document.getElementById('schedule-info');
    // 實作定期航班顯示邏輯
}

// 顯示航空公司搜尋結果
function displayAirlineResults(flights) {
    const resultsContainer = document.getElementById('airline-results');
    if (flights.length === 0) {
        resultsContainer.innerHTML = '<p>沒有找到符合的航班</p>';
        return;
    }
    
    let html = '<table><thead><tr><th>航班編號</th><th>目的地</th><th>預定時間</th><th>狀態</th></tr></thead><tbody>';
    flights.forEach(flight => {
        html += `
            <tr>
                <td>${flight.FlightNumber}</td>
                <td>${flight.ArrivalAirport}</td>
                <td>${flight.ScheduledArrivalTime}</td>
                <td>${getFlightStatus(flight.Status)}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
}

// 獲取航班狀態中文說明
function getFlightStatus(status) {
    const statusMap = {
        'ON TIME': '準時',
        'DELAYED': '延誤',
        'BOARDING': '登機中',
        'DEPARTED': '已起飛',
        'ARRIVED': '已抵達',
        'CANCELLED': '取消'
    };
    return statusMap[status] || status;
}

// 顯示錯誤訊息
function displayError(message) {
    const errorHtml = `<div class="error-message">${message}</div>`;
    document.getElementById(currentTab + '-info').innerHTML = errorHtml;
}

// 更新標籤內容
function updateTabContent() {
    if (!currentAirport) return;
    
    switch(currentTab) {
        case 'realtime':
            updateFlightData();
            break;
        case 'schedule':
            updateScheduleData();
            break;
        case 'airline':
            // 清空之前的搜尋結果
            document.getElementById('airline-results').innerHTML = '';
            document.getElementById('airline-code').value = '';
            break;
        case 'weather':
            updateWeatherData();
            break;
    }
}
