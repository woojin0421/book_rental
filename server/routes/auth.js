import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// 1. 회원가입 API
router.post('/signup', async (req, res) => {
    const { email,password, nickname, phoneNumber, entryYear, studentId} = req.body;

    // 필수 입력값 검증
    if (!email || !password || !nickname || !phoneNumber || !entryYear || !studentId) {
        return res.status(400).json({ message: "모든 항목을 입력해주세요. "});
    }

    try {
        // 이메일 중복 체크
        const [existUser] = await db.query('SELECT id FROM users WHERE email = ?',[email]);
        if (existUser.length > 0) {
            return res.status(400).json({ message: "이미 가입된 이메일입니다." });
        }
    
        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10)
        

        // DB에 유저 정보 저장
        await db.query(`
            INSERT INTO users (email, password, nickname, phone_number, entry_year, student_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [email, hashedPassword, nickname, phoneNumber, entryYear, studentId]);

        res.status(201).json({ message: "회원가입이 완료되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류로 회원가입에 실패했습니다." });
    }
});

// 2. 로그인 API
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
    }

    try {
        // 유저 존재 여부 확인
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length == 0) {
            return res.status(400).json({ message: "아이디 또는 비번이 올바르지 않습니다"});
        }
        
        const user = users[0];

        // 비밀번호 일치 여부 대조
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
           return res.status(400).json({ message: "아이디 또는 비번이 올바르지 않습니다"});
        }

        // JWT 로그인 토큰 발급
        const token = jwt.sign(
            { id: user.id, email: user.email, nickname: user.nickname},
            process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
            { expiresIn: '2h' } // 2시간 동안 유효
        );

        res.json({
            message: "로그인 성공!",
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                studentId: user.student_id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류로 로그인에 실패했습니다." });
    }
});

// 3. 내 정보 조회 API (인증 미들웨어 적용)
router.get('/me', authMiddleware, async (req, res) =>{
    try {
        //authMiddleware를 통과하면 req.user에 토큰 정보가 담겨 있습니다
        const [users] = await db.query(
            'SELECT id, email, nickname, phone_number, student_id, entry_year FROM users Where id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다."});
        }

        res.json({ user:users[0] });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다."})
    }
});

export default router;