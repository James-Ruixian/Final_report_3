# 台灣國際機場航班資訊系統

這是一個使用 TDX API 開發的航班資訊系統，提供即時航班資訊查詢功能。

## 功能特點

- 即時航班資訊查詢（到達與起飛）
  - 航班編號
  - 航空公司（中文名稱與代碼）
  - 目的地（中文名稱與代碼）
  - 預定時間
  - 航廈/登機門
  - 狀態

- 定期航班查詢
  - 可查詢各航空公司定期航班資訊
  - 顯示航班時刻表和班次
  - 依日期分組顯示航班資訊

- 航班狀態顯示
  - 即時狀態顯示（含顏色標示）
    - 準時：綠色
    - 延誤：紅色
    - 登機中/最後登機：橙色（閃爍效果）
    - 已起飛/已抵達：藍色
    - 取消：灰色（刪除線）
    - 報到中：紫色
    - 飛行中：藍色（脈動效果）
    - 即將抵達：綠色（脈動效果）

- 航空公司搜尋
  - 可依航空公司代碼搜尋特定航班

## 使用技術

- 前端：HTML5, CSS3, JavaScript (ES6+)
- 後端：Node.js, Express
- API：TDX 運輸資料流通服務 API

## 安裝與執行

1. 安裝依賴套件：
```bash
npm install
```

2. 啟動伺服器：
```bash
node server.js
```

3. 開啟瀏覽器訪問：
```
http://localhost:3000
```

## API 文件

使用的 TDX API 文件：
- 航班動態資料 API：https://tdx.transportdata.tw/api-service/swagger/basic/eb87998f-2f9c-4592-8d75-c62e5b724962#/Air/AirApi_Airport_2010
- 定期航班資料 API：https://tdx.transportdata.tw/api-service/swagger/basic/eb87998f-2f9c-4592-8d75-c62e5b724962#/Air/AirApi_International_2018
- 航班座位資訊 API：https://tdx.transportdata.tw/api-service/swagger/basic/eb87998f-2f9c-4592-8d75-c62e5b724962#/Air/AirApi_Domestic_SeatAvailability_2022

## 認證資訊

Token URL: https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token
