// TDX API 認證模組
class TDXAuth {
    constructor() {
        this.tokenUrl = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
        this.clientId = 'b11217009-792f13b3-e103-4f24';
        this.clientSecret = 'f1230f36-7c3d-4964-8a30-0482e8c8756d';
        this.accessToken = null;
        this.tokenExpireTime = null;
        
        // 立即獲取 token
        this.ensureValidToken().catch(err => {
            console.error('初始化 token 失敗:', err);
        });
    }

    // 檢查並更新 Access Token
    async ensureValidToken() {
        // 如果沒有 token 或 token 即將過期（5分鐘內），就重新取得
        if (!this.accessToken || !this.tokenExpireTime || Date.now() >= this.tokenExpireTime - 300000) {
            await this.refreshToken();
        }
        return this.accessToken;
    }

    // 重新取得 Access Token
    async refreshToken() {
        console.log('正在更新 TDX token...');
        try {
            console.log('發送 token 請求...');
            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                })
            });

            if (!response.ok) {
                throw new Error('取得 Token 失敗');
            }

            const data = await response.json();
            
            // 設定 token 和過期時間（提前5分鐘更新）
            this.accessToken = data.access_token;
            this.tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;
            
            console.log('成功獲取新的 token，將在', new Date(this.tokenExpireTime).toLocaleString(), '過期');
            return this.accessToken;
        } catch (error) {
            console.error('TDX 認證錯誤:', error);
            throw error;
        }
    }

    // 包裝 API 請求，自動處理 token
    async fetchWithToken(url, options = {}) {
        try {
            const token = await this.ensureValidToken();
            
            // 合併請求選項
            const fetchOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            };

            console.log('發送 API 請求到:', url);
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                // 如果是 401 錯誤，嘗試重新取得 token 並重試
                if (response.status === 401) {
                    console.log('Token 已過期，正在更新...');
                    await this.refreshToken();
                    return this.fetchWithToken(url, options);
                }
                throw new Error(`API 請求失敗: ${response.status}`);
            }

            const data = await response.json();
            console.log('收到 API 響應:', typeof data === 'object' ? `包含 ${Array.isArray(data) ? data.length : '0'} 條記錄` : '無數據');
            return data;
        } catch (error) {
            console.error('API 請求錯誤:', error);
            throw error;
        }
    }

    // 取得航班到站資料
    async getArrivalFlights(airport) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/FIDS/Flight?$format=JSON&$select=AirlineID,FlightNumber,DepartureAirportID,ArrivalAirportID,ScheduleArrivalTime,ActualArrivalTime,EstimatedArrivalTime,Terminal,Gate,ArrivalRemark&$filter=ArrivalAirportID eq '${airport}'&$orderby=ScheduleArrivalTime desc`;
        const data = await this.fetchWithToken(url);
        console.log('Arrival API Response:', data);
        if (data && Array.isArray(data.Records)) {
            return data.Records;
        }
        return [];
    }

    // 取得航班離站資料
    async getDepartureFlights(airport) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/FIDS/Flight?$format=JSON&$select=AirlineID,FlightNumber,DepartureAirportID,ArrivalAirportID,ScheduleDepartureTime,ActualDepartureTime,EstimatedDepartureTime,Terminal,Gate,DepartureRemark&$filter=DepartureAirportID eq '${airport}'&$orderby=ScheduleDepartureTime desc`;
        const data = await this.fetchWithToken(url);
        console.log('Departure API Response:', data);
        if (data && Array.isArray(data.Records)) {
            return data.Records;
        }
        return [];
    }

    // 取得航空公司航班資料
    async getAirlineFlights(airport, airline) {
        const departureData = await this.getDepartureFlights(airport);
        const arrivalData = await this.getArrivalFlights(airport);
        const allFlights = [...departureData, ...arrivalData];
        
        return allFlights.filter(flight => flight.AirlineID === airline);
    }

    // 取得定期航班資料
    async getScheduleFlights(airport) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/Schedule/International/Airport/${airport}?$format=JSON`;
        const data = await this.fetchWithToken(url);
        const flights = Array.isArray(data) ? data : [];
        return flights.map(flight => ({
            ...flight,
            Weekdays: this.formatWeekdays(flight.ServiceDays)
        }));
    }

    // 取得航班剩餘座位資訊
    async getSeatAvailability(flightNo) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/SeatAvailability/Domestic/Flight/${flightNo}?$format=JSON`;
        const data = await this.fetchWithToken(url);
        return Array.isArray(data) ? data : [];
    }

    // 將ServiceDays格式化為星期幾
    formatWeekdays(serviceDays) {
        if (!serviceDays) return '-';
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return days
            .filter((_, index) => serviceDays[index] === '1')
            .join('、');
    }
}

export const tdxAuth = new TDXAuth();
