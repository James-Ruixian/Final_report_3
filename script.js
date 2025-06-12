import { tdxAuth } from './tdx-auth.js';
import { airlines } from './airlines.js';
import { airports } from './airports.js';

// 全域變數
let currentAirport = '';
let currentTab = 'realtime';
let currentFlightType = 'arrival';

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
    
    try {
        const data = await (currentFlightType === 'arrival' 
            ? tdxAuth.getArrivalFlights(currentAirport)
            : tdxAuth.getDepartureFlights(currentAirport));
        
        displayFlightData(data);
    } catch (error) {
        console.error('獲取航班資料時發生錯誤:', error);
        displayError('無法載入航班資料');
    }
}

// 更新定期航班資料
async function updateScheduleData() {
    const scheduleContainer = document.getElementById('schedule-info');
    scheduleContainer.innerHTML = '<p>定期航班資料載入中...</p>';
    
    try {
        const data = await tdxAuth.getScheduleFlights(currentAirport);
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
        const data = await tdxAuth.getAirlineFlights(currentAirport, airlineCode);
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

// 格式化日期時間
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// 顯示航班資料
function displayFlightData(flights) {
    const tableBody = document.getElementById('flight-data');
    tableBody.innerHTML = '';
    
    if (!Array.isArray(flights) || flights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">目前沒有航班資料</td></tr>';
        return;
    }
    
    flights.forEach(flight => {
        if (!flight.AirlineID || !flight.FlightNumber) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flight.AirlineID}${flight.FlightNumber}</td>
            <td>${airlines[flight.AirlineID] || '-'} (${flight.AirlineID || '-'})</td>
            <td>${airports[flight.ArrivalAirportID] || '-'} (${flight.ArrivalAirportID || '-'})</td>
            <td>${currentFlightType === 'arrival' ? 
                formatDateTime(flight.ScheduleArrivalTime) : 
                formatDateTime(flight.ScheduleDepartureTime)}</td>
            <td>${flight.Terminal || '-'}/${flight.Gate || '-'}</td>
            <td>${getFlightStatus(flight.FlightStatus)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 顯示定期航班資料
function displayScheduleData(schedules) {
    const scheduleContainer = document.getElementById('schedule-info');
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
        scheduleContainer.innerHTML = '<p class="no-data">目前沒有定期航班資料</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>航班編號</th>
                    <th>航空公司</th>
                    <th>目的地</th>
                    <th>出發時間</th>
                    <th>抵達時間</th>
                </tr>
            </thead>
            <tbody>
    `;

    schedules.forEach(schedule => {
        if (!schedule.AirlineID || !schedule.FlightNumber) return;
        
        html += `
            <tr>
                <td>${schedule.AirlineID}${schedule.FlightNumber}</td>
                <td>${airlines[schedule.AirlineID] || '-'} (${schedule.AirlineID || '-'})</td>
                <td>${airports[schedule.ArrivalAirportID] || '-'} (${schedule.ArrivalAirportID || '-'})</td>
                <td>${formatDateTime(schedule.DepartureTime)}</td>
                <td>${formatDateTime(schedule.ArrivalTime)}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    scheduleContainer.innerHTML = html;
}

// 顯示航空公司搜尋結果
function displayAirlineResults(flights) {
    const resultsContainer = document.getElementById('airline-results');
    
    if (!Array.isArray(flights) || flights.length === 0) {
        resultsContainer.innerHTML = '<p class="no-data">沒有找到符合的航班</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>航班編號</th>
                    <th>航空公司</th>
                    <th>目的地</th>
                    <th>時間</th>
                    <th>航廈/登機門</th>
                    <th>狀態</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    flights.forEach(flight => {
        if (!flight.AirlineID || !flight.FlightNumber) return;
        
        html += `
            <tr>
                <td>${flight.AirlineID}${flight.FlightNumber}</td>
                <td>${airlines[flight.AirlineID] || '-'} (${flight.AirlineID || '-'})</td>
                <td>${airports[flight.ArrivalAirportID] || '-'} (${flight.ArrivalAirportID || '-'})</td>
                <td>${formatDateTime(flight.ScheduleDepartureTime)}</td>
                <td>${flight.Terminal || '-'}/${flight.Gate || '-'}</td>
                <td>${getFlightStatus(flight.FlightStatus)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
}

// 獲取航班狀態中文說明
function getFlightStatus(status) {
    if (!status) return '-';
    
    const statusMap = {
        'Scheduled': '準時',
        'Delayed': '延誤',
        'Boarding': '登機中',
        'Departed': '已起飛',
        'Arrived': '已抵達',
        'Cancelled': '取消',
        'Last Call': '最後登機',
        'Check-in': '報到中',
        'In Flight': '飛行中',
        'Approaching': '即將抵達'
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
