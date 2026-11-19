import sql from '../config/db.js';

// ════════════════════════════════════════════════════════════════
// REVIEWS GENERALES
// ════════════════════════════════════════════════════════════════

// GET /reviews
export const getReviews = async (req, res) => {
    try {
        const connection = await sql();
        const [rows] = await connection.query(`
            SELECT 
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                u.id        AS user_id,
                u.full_name AS user_name,
                u.profile_picture
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            ORDER BY r.created_at DESC
            LIMIT 50
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getReviews:', error);
        res.status(500).json({ mensaje: 'Error al obtener reseñas', error: error.message });
    }
};

// POST /reviews
export const createReview = async (req, res) => {
    try {
        const { user_id, rating, comment } = req.body;
        if (!user_id || !rating || !comment?.trim())
            return res.status(400).json({ mensaje: 'user_id, rating y comment son requeridos' });
        if (rating < 1 || rating > 5)
            return res.status(400).json({ mensaje: 'El rating debe ser entre 1 y 5' });

        const connection = await sql();
        const [existing] = await connection.query('SELECT id FROM reviews WHERE user_id = ?', [user_id]);
        if (existing.length > 0) {
            await connection.query(
                'UPDATE reviews SET rating = ?, comment = ?, created_at = NOW() WHERE user_id = ?',
                [rating, comment.trim(), user_id]
            );
            return res.status(200).json({ mensaje: 'Reseña actualizada' });
        }
        const [result] = await connection.query(
            'INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)',
            [user_id, rating, comment.trim()]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Reseña creada' });
    } catch (error) {
        console.error('Error en createReview:', error);
        res.status(500).json({ mensaje: 'Error al crear reseña', error: error.message });
    }
};

// DELETE /reviews/:id
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, admin } = req.body;
        const connection = await sql();
        if (admin) {
            await connection.query('DELETE FROM reviews WHERE id = ?', [id]);
        } else {
            await connection.query('DELETE FROM reviews WHERE id = ? AND user_id = ?', [id, user_id]);
        }
        res.status(200).json({ mensaje: 'Reseña eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar reseña', error: error.message });
    }
};

// COMENTARIOS POR VINO

// GET /wine-comments/:slug
export const getWineComments = async (req, res) => {
    try {
        const { slug } = req.params;
        const connection = await sql();
        const [rows] = await connection.query(`
            SELECT
                c.id,
                c.wine_slug,
                c.comment,
                c.created_at,
                u.id        AS user_id,
                u.full_name AS user_name,
                u.profile_picture
            FROM wine_comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.wine_slug = ?
            ORDER BY c.created_at DESC
        `, [slug]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getWineComments:', error);
        res.status(500).json({ mensaje: 'Error al obtener comentarios', error: error.message });
    }
};

// POST /wine-comments
export const createWineComment = async (req, res) => {
    try {
        const { user_id, wine_slug, comment } = req.body;
        if (!user_id || !wine_slug || !comment?.trim())
            return res.status(400).json({ mensaje: 'user_id, wine_slug y comment son requeridos' });

        const connection = await sql();
        const [existing] = await connection.query(
            'SELECT id FROM wine_comments WHERE user_id = ? AND wine_slug = ?',
            [user_id, wine_slug]
        );
        if (existing.length > 0) {
            await connection.query(
                'UPDATE wine_comments SET comment = ?, created_at = NOW() WHERE user_id = ? AND wine_slug = ?',
                [comment.trim(), user_id, wine_slug]
            );
            return res.status(200).json({ mensaje: 'Comentario actualizado' });
        }
        const [result] = await connection.query(
            'INSERT INTO wine_comments (user_id, wine_slug, comment) VALUES (?, ?, ?)',
            [user_id, wine_slug, comment.trim()]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Comentario creado' });
    } catch (error) {
        console.error('Error en createWineComment:', error);
        res.status(500).json({ mensaje: 'Error al crear comentario', error: error.message });
    }
};

// DELETE /wine-comments/:id
export const deleteWineComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, admin } = req.body;
        const connection = await sql();
        if (admin) {
            await connection.query('DELETE FROM wine_comments WHERE id = ?', [id]);
        } else {
            await connection.query('DELETE FROM wine_comments WHERE id = ? AND user_id = ?', [id, user_id]);
        }
        res.status(200).json({ mensaje: 'Comentario eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar comentario', error: error.message });
    }
};

// GET /wine-comments — todos (para admin)
export const getAllWineComments = async (req, res) => {
    try {
        const connection = await sql();
        const [rows] = await connection.query(`
            SELECT
                c.id,
                c.wine_slug,
                c.comment,
                c.created_at,
                u.id        AS user_id,
                u.full_name AS user_name,
                u.profile_picture
            FROM wine_comments c
            JOIN users u ON u.id = c.user_id
            ORDER BY c.created_at DESC
            LIMIT 200
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener comentarios', error: error.message });
    }
};

// ════════════════════════════════════════════════════════════════
// FEEDBACK FASE PILOTO (privado — solo visible para el admin)
// ════════════════════════════════════════════════════════════════
// FEEDBACK FASE PILOTO (privado — solo visible para el admin)
// ════════════════════════════════════════════════════════════════

// POST /pilot-feedback
export const createFeedback = async (req, res) => {
    try {
        const { user_id, email, name, rating, comment } = req.body;
        if (!email || !rating || !comment?.trim()) {
            return res.status(400).json({ mensaje: 'Email, rating y comentario son requeridos' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ mensaje: 'El rating debe ser entre 1 y 5' });
        }
        const connection = await sql();
        const [existing] = await connection.query('SELECT id FROM pilot_feedback WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ mensaje: 'Ya enviaste tu opinión. ¡Gracias por participar!', alreadySent: true });
        }
        const [result] = await connection.query(
            'INSERT INTO pilot_feedback (user_id, email, name, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [user_id || null, email.trim(), name?.trim() || null, rating, comment.trim()]
        );
        res.status(201).json({ id: result.insertId, mensaje: '¡Gracias por tu opinión!' });
    } catch (error) {
        console.error('Error en createFeedback:', error);
        res.status(500).json({ mensaje: 'Error al enviar opinión', error: error.message });
    }
};

// GET /pilot-feedback  (solo admin)
export const getFeedback = async (req, res) => {
    try {
        const connection = await sql();
        const [rows] = await connection.query(`
            SELECT id, user_id, email, name, rating, comment, created_at
            FROM pilot_feedback
            ORDER BY created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener feedback', error: error.message });
    }
};

// DELETE /pilot-feedback/:id  (solo admin)
export const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await sql();
        await connection.query('DELETE FROM pilot_feedback WHERE id = ?', [id]);
        res.status(200).json({ mensaje: 'Opinión eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar feedback', error: error.message });
    }
};

// GET /pilot-feedback/check?email=... — verifica si ya envió feedback
export const checkFeedback = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ mensaje: 'Email requerido' });
        const connection = await sql();
        const [rows] = await connection.query('SELECT id FROM pilot_feedback WHERE email = ?', [email.trim()]);
        res.status(200).json({ alreadySent: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar feedback' });
    }
};
