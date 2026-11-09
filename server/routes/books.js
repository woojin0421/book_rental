// # 마스터 도서 목록 조회, 통합 감상평(reviews) 조회/등록
import express from 'express';
import db from '../db.js';

const router = express.Router();

// 1. 전체 도서 목록 조회
router.get('/', async (req, res) => {
    try {
        const [books] = await db.query('SELECT * FROM master_books ORDER BY id DESC');
        res.json({ books });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다."});
    }
});

export default router;