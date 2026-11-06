const jwt = require('jsonwebtoken');

// 로그인 여부 검즉 미들웨어 함수
module.exports = function (req, res, next) {
    // 1 요청 헤더에서 토큰 꺼내기
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] // "Bearer TOKEN"

    // 2 토큰이 없으면 거부
    if (!token) {
        return res.status(401).json({ message: "로그인이 필요한 서비스입니다."});
    }
}

try {
    // 3 토큰이 유효한지 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_2026');
    req.user = decoded; // 유저 정보 req객체에 저장
    next(); // 검증 성공 시 다음 단계로 통과
} catch (err) {
    return res.status(403).json({ message: "유효하지 않거나 만료된 토큰입니다." });
}