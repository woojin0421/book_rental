import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';

const __filename = fileURLToPath(import.meta.url); // 추가
const __dirname = path.dirname(__filename);         //  추가

// 환경변수 및 Express 앱 초기화 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;              // .env 파일에 PORT 저장 (기본값 5000 설정)

// 미들웨어 설정
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// 라우터 연결
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);

// 기본 루트 엔드포인트
app.get('/', (req, res) => {
  res.send('Backend Server is running...');
});


// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});