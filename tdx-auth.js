// TDX API 認證模組
class TDXAuth {
    constructor() {
        this.tokenUrl = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
        this.clientId = 'B11217009-358c5dea-425c-4a24';
        this.clientSecret = '2280ae77-5d86-4db1-9b65-4f5b376ca8c5';
        this.accessToken = null;
        this.tokenExpireTime = null;
    }

    // 取得 Access Token
    async getAccessToken() {
        // 如果現有的 token 還沒過期，直接返回
        if (this.accessToken && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
            return this.accessToken;
        }

        try {
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
            
            return this.accessToken;
        } catch (error) {
            console.error('TDX 認證錯誤:', error);
            throw error;
        }
    }

    // 包裝 API 請求，自動處理 token
    async fetchWithToken(url, options = {}) {
        try {
            const token = await this.getAccessToken();
            
            // 合併請求選項
            const fetchOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`API 請求失敗: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API 請求錯誤:', error);
            throw error;
        }
    }

    // 取得航班到站資料
    async getArrivalFlights(airport) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/FIDS/Flight?$format=JSON`;
        const data = await this.fetchWithToken(url);
        if (!Array.isArray(data)) return [];
        return data.filter(flight => 
            flight.ArrivalAirportID === airport && 
            flight.DepartureAirportID !== airport);
    }

    // 取得航班離站資料
    async getDepartureFlights(airport) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/FIDS/Flight?$format=JSON`;
        const data = await this.fetchWithToken(url);
        if (!Array.isArray(data)) return [];
        return data.filter(flight => 
            flight.DepartureAirportID === airport && 
            flight.ArrivalAirportID !== airport);
    }

    // 取得航空公司航班資料
    async getAirlineFlights(airport, airline) {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Air/FIDS/Flight?$format=JSON`;
        const data = await this.fetchWithToken(url);
        if (!Array.isArray(data)) return [];
        return data.filter(flight => 
            flight.AirlineID === airline &&
            (flight.DepartureAirportID === airport || flight.ArrivalAirportID === airport));
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
