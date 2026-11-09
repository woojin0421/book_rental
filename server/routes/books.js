// # 마스터 도서 목록 조회, 통합 감상평(reviews) 조회/등록
import express from 'express';
import db from '../db.js';
import authMiddleware from '../middlewares/auth.js';

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

// 2. 신규 도서 등록 
router.post('/', authMiddleware, async (req, res) => {
    try {
         const { title, author, publisher, isbn, category, cover_image } = req.body;

         //  필수 입력값 검증
         if (!title || !author || !category) {
            return res.status(400).json({ message: "제목, 저자, 카테고리는 필수 입력 항목입니다."});
         }

         // DB 도서 정보 저장
         const [result] = await db.query(
            'INSERT INTO master_books (title, author, publisher, isbn, category, cover_image) VALUES (?, ?, ?, ?, ?, ?)',
            [title, author, publisher || null, isbn || null, category, cover_image || null]
         );

         res.status(201).json({
            message: "도서가 성공적으로 등록되었습니다.",
            bookId: result.insertId
         });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 3. 특정 도서 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        // 1) 마스터 도서 기본 정보 조회
        const [books] = await db. query(
            'SELECT * FROM master_books WHERE id = ?',
            [id]
        );

        if (books.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 도서입니다." });
        }

        // 2) 해당 도서를 소유한 유저들의 대여 등록 목록 조회
        const [rentalItems] = await db.query(
            `SELECT r.id AS rental_item_id, r.owner_comment, r.location, r.status, u.nickname AS owner_nickname
             FROM rental_items r
             JOIN users u ON r.owner_id = u.id
             WHERE r.master_book_id = ?`,
            [id]
        );

        res.json({
            book: books[0],
            rentals: rentalItems
        });
    }   catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다."});
    }
});

export default router;