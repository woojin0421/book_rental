// # 내 책 렌탈 등록(rental_items), 대여 신청/수락/반납 처리
import express from 'express';
import db from '../db.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// 1. 대여 신청 - 로그인 필요
router.post('/', authMiddleware, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { rental_item_id } = req.body;
        const borrow_id = req.user.id; // 로그인한 유저 ID

        if (!rental_item_id) {
            return res.status(400).json({ message: "대여할 아이템 ID가 필요합니다."});
        }

        await conn.beginTransaction();

        // 대여 아이템 존재 여부 대여 가능 상태 확인
        const [items] = await conn.query(
            'SELECT * FROM rental_items WHERE id = ? FOR UPDATE',
            [rental_item_id]
        );

        if (items.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 대여 아이템 입니다." });
        }

        const rentalItem = items[0];

        if ( rentalItem.status !== 'AVAILABLE') {
            return res.status(400).json({ message: "이미 대여 신청을 완료한 도서입니다." });
        }

        // 자기가 등록한 책은 스스로 빌릴 수 없음
        if ( rentalItem.owner_id === borrow_id) {
            return res.status(400).json({ message: "자신이 등록한 책은 대여 신청할 수 없습니다."});
        }

         const [existingRentals] = await conn.query(
            `SELECT id FROM rentals 
            WHERE rental_item_id = ? 
            AND borrower_id = ? 
            AND status = 'REQUESTED'`,
            [rental_item_id, borrow_id]
        );

        if (existingRentals.length > 0) {
            return res.status(400).json({ message: "이미 대여 신청을 완료한 도서입니다." });
        }

        const [result] = await db.query(
            'INSERT INTO rentals (rental_item_id, borrower_id, status) VALUES (?, ?, ?)',
            [rental_item_id, borrow_id, 'REQUESTED']
        );

        await conn.commit();

        res.status(201).json({
            message: "대여 신청이 성공적으로 완료되었습니다.",
            rentalId: result.insertId
        });
    }   catch (err) {
        console.error(err);
        conn.rollback();
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    } finally {
        conn.release();
    }
});

// 2. 내 대여/빌려준 내역 조회 - 로그인 필요
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 내가 빌린 책 목록
        const [borrowed] = await db.query(
            `SELECT r.id AS rental_id, r.status, r.created_at,
                    mb.title, mb.author, mb.cover_image,
                    u.nickname AS owner_nickname
             FROM rentals r
             JOIN rental_items ri ON r.rental_item_id = ri.id
             JOIN master_books mb ON ri.master_book_id = mb.id
             JOIN users u ON ri.owner_id = u.id
             WHERE r.borrower_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );

        // 내가 빌려준/신청 들어온 책 목록 (Owner)
        const [lent] = await db.query(
            `SELECT r.id AS rental_id, r.status, r.created_at,
                    mb.title, mb.author, mb.cover_image,
                    u.nickname AS borrower_nickname
             FROM rentals r
             JOIN rental_items ri ON r.rental_item_id = ri.id
             JOIN master_books mb ON ri.master_book_id = mb.id
             JOIN users u ON r.borrower_id = u.id
             WHERE ri.owner_id = ?
             ORDER BY r.created_at DESC`,
             [userId]
        );

        res.json({
            borrowed, // 내가 빌린 목록
            lent    // 내가 빌려준 목록
        })
    }   catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 3. 대여 상태 변경(수락 / 거절) - 로그인 필요
router.patch('/:id/status', authMiddleware, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const rentalId = req.params.id;
        const { status } = req.body; // 'ACCEPTED' 또는 'REJECTED'
        const userId = req.user.id;

        // 입력값 유효성 검사 (ACCEPTED 또는 REJECTED만 허용)
        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: "올바른 상태값('ACCEPTED' 또는 'REJECTED')을 입력해주세요." });
        }

        // 대여 정보 및 소유자 정보 조회
        const [rentals] = await conn.query(
            `SELECT r.*, ri.owner_id 
             FROM rentals r
             JOIN rental_items ri ON r.rental_item_id = ri.id
             WHERE r.id = ?`,
            [rentalId]
        );

        if (rentals.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 대여 신청입니다." });
        }

        const rental = rentals[0];

        // 책 주인이 맞는지 확인
        if (rental.owner_id !== userId) {
            return res.status(403).json({ message: "대여 신청을 수락/거절할 권한이 없습니다." });
        }

        // REQUESTED 상태일 때만 변경 가능
        if (rental.status !== 'REQUESTED') {
            return res.status(400).json({ message: "이미 처리되었거나 변경할 수 없는 대여 상태입니다." });
        }

        await conn.beginTransaction();

        // 대여 상태 업데이트
        await conn.query(
            'UPDATE rentals SET status = ? WHERE id = ?',
            [status, rentalId]
        );

        if (status === 'ACCEPTED') {
            await conn.query (
                `UPDATE rentals 
                 SET status = 'REJECTED' 
                 WHERE rental_item_id = ? 
                   AND id != ? 
                   AND status = 'REQUESTED'`,
                [rental.rental_item_id, rentalId]
            );

            // 2) 해당 책의 상태를 'RENTED'(대여 중)로 변경
            await conn.query(
                "UPDATE rental_items SET status = 'RENTED' WHERE id = ?",
                [rental.rental_item_id]
            );
        }
        await conn.commit();

        res.json({ message: `대여 신청이 성공적으로 ${status === 'ACCEPTED' ? '수락' : '거절'}되었습니다. 🤝` });

    } catch (error) {
        console.error(error);
        await conn.rollback()
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    } finally {
        conn.release();
    }
});
// 4. 도서 반납 처리 - 로그인 필요
router.patch('/:id/return', authMiddleware, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const rentalId = req.params.id;
        const userId = req.user.id;

        //  대여 정보 조회 
        const [rentals] = await conn.query(
            `SELECT r.*, ri.owner_id 
             FROM rentals r
             JOIN rental_items ri ON r.rental_item_id = ri.id
             WHERE r.id = ?`,
            [rentalId]
        );

        if (rentals.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 대여 건입니다." });
        }

        const rental = rentals[0];

        // 👤 빌린 사람이나 책 주인만 반납 처리 가능
        if (rental.borrower_id !== userId && rental.owner_id !== userId) {
            return res.status(403).json({ message: "반납 처리를 할 권한이 없습니다." });
        }

        // 'ACCEPTED'(대여 중) 상태일 때만 반납 가능
        if (rental.status !== 'ACCEPTED') {
            return res.status(400).json({ message: "대여 중('ACCEPTED')인 상태에서만 반납 처리할 수 있습니다." });
        }

        // 'RETURNED'로 변경
        await db.query(
            "UPDATE rentals SET status = 'RETURNED' WHERE id = ?",
            [rentalId]
        );

        res.json({ message: "도서 반납 처리가 성공적으로 완료되었습니다." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});



export default router;