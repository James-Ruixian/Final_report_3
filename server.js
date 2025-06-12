import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// 啟用 CORS
app.use(cors());

// 設定靜態檔案目錄
app.use(express.static(__dirname));

// 路由首頁
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器執行中: http://localhost:${port}`);
});
