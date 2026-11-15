// # 마스터 도서 목록 조회, 통합 감상평(reviews) 조회/등록
import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// ISBN-10을 ISBN-13으로 변환하는 유틸 함수
function toIsbn13(input) {
    if (!input) return '';
    const digits = String(input).replace(/[^0-9X]/gi, '');
    if (digits.length === 13) return digits;
    if (digits.length === 10) {
        const base = '978' + digits.slice(0, 9);
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
        }
        const check = (10 - (sum % 10)) % 10;
        return base + check;
    }
    return digits;
}

// 책등(SpineShelf, spine, _d.jpg 등)을 감지하고 무조건 선명한 정면 표지로 교정하는 유틸
function sanitizeCoverUrl(url, isbn13) {
    if (!url && isbn13) {
        return `https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/${isbn13}.jpg`;
    }
    if (!url) return '';

    // 알라딘 및 일반 책등 이미지 경로를 고해상도 정면 표지 경로로 치환
    let cleaned = url
        .replace(/\/SpineShelf\//gi, '/cover500/')
        .replace(/\/coversum\//gi, '/cover500/')
        .replace(/\/cover200\//gi, '/cover500/')
        .replace(/_d\.jpg/gi, '_1.jpg')
        .replace(/_spine/gi, '')
        .replace(/_side/gi, '');

    // 만약 여전히 Spine이나 _d가 남아있거나 옆면이면 교보문고 공식 정면 CDN으로 대체
    if ((cleaned.includes('Spine') || cleaned.includes('_d.jpg') || cleaned.includes('spine')) && isbn13) {
        return `https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/${isbn13}.jpg`;
    }
    return cleaned;
}

// 1. 전체 도서 목록 조회 (대여 가능 수량 포함 & 표지 정면 보정)
router.get('/', async (req, res) => {
    try {
        const [books] = await db.query(`
            SELECT mb.*, 
                   COUNT(ri.id) AS total_rentals, 
                   COALESCE(SUM(CASE WHEN ri.status = 'AVAILABLE' THEN 1 ELSE 0 END), 0) AS available_rentals 
            FROM master_books mb 
            LEFT JOIN rental_items ri ON mb.id = ri.master_book_id 
            GROUP BY mb.id 
            ORDER BY mb.id DESC
        `);

        // 기존 등록된 도서 중 혹시 모를 책등(Spine) 이미지가 있다면 정면 표지로 자동 보정
        const sanitizedBooks = books.map((b) => {
            const isbn13 = toIsbn13(b.isbn);
            let img = b.cover_image;
            if (img && (img.includes('SpineShelf') || img.includes('_d.jpg') || img.includes('spine'))) {
                img = sanitizeCoverUrl(img, isbn13);
            }
            return { ...b, cover_image: img };
        });

        res.json({ books: sanitizedBooks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다."});
    }
});

// 1-1. ISBN 또는 도서명으로 외부 도서 정보 실시간 조회 (교보문고 정면 CDN & 알라딘/구글북스 실시간 연동, 네이버 코드 완전 배제)
router.get('/search-isbn', async (req, res) => {
    try {
        const { isbn, query } = req.query;
        const searchTerm = (isbn || query || '').trim();

        if (!searchTerm) {
            return res.status(400).json({ message: "ISBN 또는 도서명을 입력해주세요." });
        }

        const isbn13 = toIsbn13(searchTerm);

        // 1. [1순위] 교보문고 공식 정면 표지 CDN 확인 (ISBN이 있을 경우 100% 보장되는 선명한 정면 표지)
        let guaranteedCover = '';
        if (isbn13 && isbn13.length === 13) {
            const kyoboCoverUrl = `https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/${isbn13}.jpg`;
            try {
                const kRes = await fetch(kyoboCoverUrl, {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                if (kRes.ok && kRes.status === 200) {
                    guaranteedCover = kyoboCoverUrl;
                }
            } catch (kErr) {
                // CDN 확인 실패 시 fallback 진행
            }
        }

        // 2. 알라딘 실시간 서지 검색 (도서명, 저자, 출판사 및 표지 정보 추출)
        try {
            const aladinUrl = `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${encodeURIComponent(searchTerm)}`;
            const aRes = await fetch(aladinUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
                }
            });

            if (aRes.ok) {
                const html = await aRes.text();

                // 제목 매칭
                const titleMatch = html.match(/class="bo3"[^>]*><b>([^<]+)<\/b>/i) ||
                                   html.match(/class="bo3"[^>]*>([^<]+)<\/a>/i);

                if (titleMatch) {
                    const foundTitle = titleMatch[1].trim();
                    let foundAuthor = '저자 미상';
                    let foundPublisher = '';

                    // 저자 매칭
                    const authorMatch = html.match(/<a[^>]*AuthorSearch[^>]*>([^<]+)<\/a>/i) ||
                                        html.match(/<li[^>]*>[^<]*<a[^>]*>([^<]+)<\/a>[^<]*\((?:지은이|저자)\)/i);
                    if (authorMatch) foundAuthor = authorMatch[1].trim();

                    // 출판사 매칭 (PublisherSearch 링크 또는 도서 정보 라인)
                    const pubMatch = html.match(/PublisherSearch=[^"'>]*">([^<]+)<\/a>/i) ||
                                     html.match(/<a[^>]*PublisherSearch[^>]*>([^<]+)<\/a>/i) ||
                                     html.match(/\|\s*<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>\s*\|\s*[0-9]{4}/i);
                    if (pubMatch) foundPublisher = pubMatch[1].trim();

                    // 표지 이미지: 교보 공식 CDN 1순위 -> 알라딘 정면 표지 2순위
                    let coverImage = guaranteedCover;
                    if (!coverImage) {
                        // 알라딘 정면 표지 (/cover500/, /coversum/, /cover200/)
                        const aladinCoverMatch = html.match(/https:\/\/image\.aladin\.co\.kr\/product\/[0-9/]+\/cover[0-9]*\/[^"'\s<>]+\.jpg/i);
                        if (aladinCoverMatch) {
                            coverImage = aladinCoverMatch[0].replace(/\/coversum\//i, '/cover500/').replace(/\/cover200\//i, '/cover500/');
                        } else {
                            const rawImg = html.match(/https:\/\/image\.aladin\.co\.kr\/product\/[0-9/]+\/[^"'\s<>]+\.jpg/i);
                            if (rawImg) {
                                coverImage = sanitizeCoverUrl(rawImg[0], isbn13);
                            }
                        }
                    }

                    // 책등(Spine) 방어 최종 정제
                    coverImage = sanitizeCoverUrl(coverImage, isbn13);

                    return res.json({
                        books: [{
                            title: foundTitle,
                            author: foundAuthor,
                            publisher: foundPublisher,
                            isbn: isbn13 || searchTerm,
                            cover_image: coverImage,
                            description: '',
                            source: 'web'
                        }],
                        total: 1
                    });
                }
            }
        } catch (aErr) {
            console.error("알라딘 서지 검색 오류:", aErr.message);
        }

        // 3. Google Books API (무료 오픈 API 폴백)
        try {
            const googleUrl = (isbn13 && isbn13.length >= 10)
                ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}`
                : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=5`;

            const gRes = await fetch(googleUrl);
            if (gRes.ok) {
                const gData = await gRes.json();
                if (gData.items && gData.items.length > 0) {
                    const books = gData.items.map((item) => {
                        const info = item.volumeInfo || {};
                        const identifiers = info.industryIdentifiers || [];
                        const isbnObj = identifiers.find((i) => i.type === 'ISBN_13') || identifiers[0];
                        const thisIsbn = isbnObj ? isbnObj.identifier : (isbn13 || searchTerm);
                        const thumbnail = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';

                        return {
                            title: info.title || '',
                            author: (info.authors || []).join(', ') || '저자 미상',
                            publisher: info.publisher || '',
                            isbn: thisIsbn,
                            cover_image: guaranteedCover || (thumbnail ? thumbnail.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '') : sanitizeCoverUrl('', thisIsbn)),
                            description: info.description || '',
                            source: 'google'
                        };
                    });
                    if (books.length > 0 && books[0].title) {
                        return res.json({ books, total: books.length });
                    }
                }
            }
        } catch (gErr) {
            console.error("Google Books API 오류:", gErr.message);
        }

        // 4. 만약 검색결과가 없지만 유효한 ISBN인 경우 교보 정면 표지와 함께 기본 템플릿 반환
        if (guaranteedCover) {
            return res.json({
                books: [{
                    title: '',
                    author: '',
                    publisher: '',
                    isbn: isbn13,
                    cover_image: guaranteedCover,
                    description: '',
                    source: 'kyobo-direct'
                }],
                total: 1
            });
        }

        return res.json({ books: [], total: 0, message: "검색된 도서 정보가 없습니다. 도서 정보를 직접 입력해주세요." });
    } catch (err) {
        console.error("도서 검색 전체 오류:", err);
        res.status(500).json({ message: "도서 검색 중 오류가 발생했습니다." });
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
        const { id } = req.params;

        // 선택적 토큰 검증: 로그인한 사용자인 경우 사용자 ID 추출
        let currentUserId = 0;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_2026');
                currentUserId = decoded.id || 0;
            } catch (jwtErr) {
                // 토큰 만료 또는 비정상 토큰 시 게스트로 조회 계속 진행
            }
        }

        // 1) 마스터 도서 기본 정보 조회
        const [books] = await db.query(
            'SELECT * FROM master_books WHERE id = ?',
            [id]
        );

        if (books.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 도서입니다." });
        }

        const book = books[0];
        const isbn13 = toIsbn13(book.isbn);
        if (book.cover_image && (book.cover_image.includes('SpineShelf') || book.cover_image.includes('_d.jpg') || book.cover_image.includes('spine'))) {
            book.cover_image = sanitizeCoverUrl(book.cover_image, isbn13);
        }

        // 2) 해당 도서를 소유한 유저들의 대여 등록 목록 조회 (owner_id, 대기 신청자 수, 로그인 유저의 신청 여부 포함)
        const [rentalItems] = await db.query(
            `SELECT r.id AS rental_item_id, r.owner_id, r.owner_comment, r.location, r.status, 
                    u.nickname AS owner_nickname,
                    (SELECT COUNT(*) FROM rentals WHERE rental_item_id = r.id AND status = 'REQUESTED') AS request_count,
                    (SELECT status FROM rentals WHERE rental_item_id = r.id AND borrower_id = ? AND status IN ('REQUESTED', 'ACCEPTED') ORDER BY FIELD(status, 'REQUESTED', 'ACCEPTED') LIMIT 1) AS my_request_status,
                    (SELECT id FROM rentals WHERE rental_item_id = r.id AND borrower_id = ? AND status = 'REQUESTED' LIMIT 1) AS my_rental_id
             FROM rental_items r
             JOIN users u ON r.owner_id = u.id
             WHERE r.master_book_id = ?`,
            [currentUserId, currentUserId, id]
        );

        res.json({
            book: book,
            rentals: rentalItems
        });
    }   catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다."});
    }
});

// 4. 소유 도서 대여 등록 - 인증필요
router.post('/:id/rentals', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const owner_id = req.user.id; // authMiddleware에서 넘겨준 로그인 유저 ID
        const { owner_comment, location } = req.body;

        // 필수 입력값 검증
        if (!owner_comment || !location) {
            return res.status(400).json({ message: "한 줄 추천평(소개)과 거래 장소는 필수 입력 항목입니다." });
        }

        // 해당 마스터 도서가 존재하는지 확인
        const [books] = await db.query('SELECT id FROM master_books WHERE id = ?', [id]);
        if (books.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 도서입니다."});
        }

        // [중복 방지 검증]: 동일한 유저가 같은 도서를 중복으로 대여 등록하는 것 방지
        const [existingItems] = await db.query(
            'SELECT id FROM rental_items WHERE master_book_id = ? AND owner_id = ?',
            [id, owner_id]
        );

        if (existingItems.length > 0) {
            return res.status(400).json({ 
                message: "이미 회원님께서 대여 등록하신 도서입니다. 동일 도서는 중복 등록하실 수 없습니다." 
            });
        }

        // rental_items 테이블에 대여 가능 책 등록
        const [result] = await db.query(
            'INSERT INTO rental_items (master_book_id, owner_id, owner_comment, location) VALUES (?, ?, ?, ?)',
            [id, owner_id, owner_comment, location]
        );

        res.status(201).json({
            message: "대여 등록이 완료되었습니다.",
            rentalItemId: result.insertId
        });
    }   catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류가 발생했습니다."});
    }
});

export default router;