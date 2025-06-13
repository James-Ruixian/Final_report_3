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

document.addEventListener('DOMContentLoaded', () => {
    initializeAirportButtons();
    initializeTabButtons();

    // 初始化出發/抵達按鈕
    const flightButtons = document.querySelectorAll('.flight-btn');
    flightButtons.forEach(button => {
        button.addEventListener('click', () => {
            flightButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            currentFlightType = button.dataset.type;
            if (currentAirport) {
                updateFlightData();
            }
        });
    });

    // 設置預設選中的按鈕
    const defaultButton = document.querySelector('.flight-btn[data-type="departure"]');
    if (defaultButton) {
        defaultButton.classList.add('active');
        currentFlightType = 'departure';
    }
    
    initializeAirlineSearch();
    initializeSeatsSearch();
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
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function formatDate(dateTimeStr) {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit'
    });
}

function groupFlightsByDate(flights) {
    // 先排序航班
    flights.sort((a, b) => {
        const timeA = currentFlightType === 'arrival' 
            ? (a.EstimatedArrivalTime || a.ScheduleArrivalTime)
            : (a.EstimatedDepartureTime || a.ScheduleDepartureTime);
        const timeB = currentFlightType === 'arrival'
            ? (b.EstimatedArrivalTime || b.ScheduleArrivalTime)
            : (b.EstimatedDepartureTime || b.ScheduleDepartureTime);
        return new Date(timeA) - new Date(timeB);
    });

    const groups = {};
    flights.forEach(flight => {
        const time = currentFlightType === 'arrival'
            ? (flight.EstimatedArrivalTime || flight.ScheduleArrivalTime)
            : (flight.EstimatedDepartureTime || flight.ScheduleDepartureTime);
        const date = formatDate(time);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(flight);
    });

    // 將日期轉換為有序的鍵值對陣列
    const orderedGroups = Object.entries(groups)
        .sort(([dateA], [dateB]) => {
            const [monthA, dayA] = dateA.split('/').map(Number);
            const [monthB, dayB] = dateB.split('/').map(Number);
            return monthA === monthB ? dayA - dayB : monthA - monthB;
        })
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});

    return orderedGroups;
}

// 顯示航班資料
function displayFlightData(flights) {
    const tableBody = document.getElementById('flight-data');
    tableBody.innerHTML = '';
    
    if (!Array.isArray(flights) || flights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">目前沒有航班資料</td></tr>';
        return;
    }

    console.log('Flights data:', flights);

    const groupedFlights = groupFlightsByDate(flights);
    
    Object.entries(groupedFlights).forEach(([date, dateFlights]) => {
        // 添加日期標題行
        const dateHeader = document.createElement('tr');
        dateHeader.innerHTML = `<td colspan="6" class="date-header">${date} 月/日</td>`;
        tableBody.appendChild(dateHeader);

            // 添加該日期的航班資料
        dateFlights.forEach(flight => {
            if (!flight.AirlineID || !flight.FlightNumber) return;
            
            const row = document.createElement('tr');
            const status = getFlightStatus(currentFlightType === 'arrival' ? flight.ArrivalRemark : flight.DepartureRemark);
            
            const scheduleTime = currentFlightType === 'arrival'
                ? (flight.EstimatedArrivalTime || flight.ScheduleArrivalTime)
                : (flight.EstimatedDepartureTime || flight.ScheduleDepartureTime);

            const airport = currentFlightType === 'arrival' 
                ? flight.DepartureAirportID 
                : flight.ArrivalAirportID;

            row.innerHTML = `
                <td>${flight.AirlineID}${flight.FlightNumber}</td>
                <td>${airlines[flight.AirlineID] || '-'} (${flight.AirlineID || '-'})</td>
                <td>${airports[airport] || '-'} (${airport || '-'})</td>
                <td>${formatDateTime(scheduleTime)}</td>
                <td>${flight.Terminal || '-'}/${flight.Gate || '-'}</td>
                <td class="flight-status ${status.class}">${status.text}</td>
            `;
            tableBody.appendChild(row);
        });
    });
}

// 顯示定期航班資料
function displayScheduleData(schedules) {
    const scheduleContainer = document.getElementById('schedule-info');
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
        scheduleContainer.innerHTML = '<p class="no-data">目前沒有定期航班資料</p>';
        return;
    }

    // 按日期分組
    const groupedSchedules = groupFlightsByDate(schedules);

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

    Object.entries(groupedSchedules).forEach(([date, dateSchedules]) => {
        // 添加日期標題行
        html += `<tr><td colspan="5" class="date-header">${date} 月/日</td></tr>`;

        dateSchedules.forEach(schedule => {
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

    // 按日期分組
    const groupedFlights = groupFlightsByDate(flights);
    
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
    
    Object.entries(groupedFlights).forEach(([date, dateFlights]) => {
        // 添加日期標題行
        html += `<tr><td colspan="6" class="date-header">${date} 月/日</td></tr>`;

        dateFlights.forEach(flight => {
            if (!flight.AirlineID || !flight.FlightNumber) return;
            
            html += `
                <tr>
                    <td>${flight.AirlineID}${flight.FlightNumber}</td>
                    <td>${airlines[flight.AirlineID] || '-'} (${flight.AirlineID || '-'})</td>
                    <td>${airports[flight.ArrivalAirportID] || '-'} (${flight.ArrivalAirportID || '-'})</td>
                    <td>${formatDateTime(flight.ScheduleDepartureTime)}</td>
                    <td>${flight.Terminal || '-'}/${flight.Gate || '-'}</td>
                    <td class="flight-status ${getFlightStatus(flight.FlightStatus).class}">${getFlightStatus(flight.FlightStatus).text}</td>
                </tr>
            `;
        });
    });
    
    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
}

// 獲取航班狀態中文說明與樣式
function getFlightStatus(status) {
    if (!status) return { text: '-', class: '' };
    
    const statusConfig = {
        '準點': { text: '準時', class: 'status-ontime' },
        '延誤': { text: '延誤', class: 'status-delayed' },
        '登機中': { text: '登機中', class: 'status-boarding' },
        '起飛': { text: '已起飛', class: 'status-departed' },
        '到達': { text: '已抵達', class: 'status-arrived' },
        '取消': { text: '取消', class: 'status-cancelled' },
        '最後登機': { text: '最後登機', class: 'status-boarding' },
        '報到': { text: '報到中', class: 'status-checkin' },
        '飛行中': { text: '飛行中', class: 'status-inflight' },
        '接近中': { text: '即將抵達', class: 'status-approaching' },
        '時間更改': { text: '時間異動', class: 'status-delayed' }
    };
    return statusConfig[status] || { text: status, class: '' };
}

// 顯示錯誤訊息
function displayError(message) {
    const errorHtml = `<div class="error-message">${message}</div>`;
    document.getElementById(currentTab + '-info').innerHTML = errorHtml;
}

// 初始化座位查詢功能
function initializeSeatsSearch() {
    const searchButton = document.getElementById('search-seats-btn');
    searchButton.addEventListener('click', () => {
        const flightNumber = document.getElementById('flight-number').value.toUpperCase();
        searchSeatAvailability(flightNumber);
    });
}

// 查詢座位資訊
async function searchSeatAvailability(flightNumber) {
    if (!flightNumber) return;
    
    const resultsContainer = document.getElementById('seats-result');
    resultsContainer.innerHTML = '<p>查詢中...</p>';
    
    try {
        const data = await tdxAuth.getSeatAvailability(flightNumber);
        displaySeatAvailability(data);
    } catch (error) {
        console.error('查詢座位資訊時發生錯誤:', error);
        displayError('無法載入座位資訊');
    }
}

// 顯示座位資訊
function displaySeatAvailability(seatData) {
    const resultsContainer = document.getElementById('seats-result');
    
    if (!Array.isArray(seatData) || seatData.length === 0) {
        resultsContainer.innerHTML = '<p class="no-data">找不到該航班的座位資訊</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>航班編號</th>
                    <th>艙等</th>
                    <th>剩餘座位數</th>
                    <th>更新時間</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    seatData.forEach(seat => {
        html += `
            <tr>
                <td>${seat.AirlineID}${seat.FlightNumber}</td>
                <td>${seat.CabinClass || '-'}</td>
                <td>${seat.SeatAvailable || '-'}</td>
                <td>${formatDateTime(seat.UpdateTime)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
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
        case 'seats':
            // 清空之前的搜尋結果
            document.getElementById('seats-result').innerHTML = '';
            document.getElementById('flight-number').value = '';
            break;
        case 'weather':
            updateWeatherData();
            break;
    }
}
