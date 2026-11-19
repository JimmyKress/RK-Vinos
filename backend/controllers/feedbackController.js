import sql from '../config/db.js';

export const submitFeedback = async (req, res) => {
  try {
    const connection = await sql();
    const { user_id, feedback } = req.body;

    if (!user_id || !feedback) {
      return res.status(400).json({ mensaje: 'ID de usuario y feedback son requeridos' });
    }

    const [result] = await connection.query(
      'INSERT INTO pilot_feedback (user_id, feedback) VALUES (?, ?)',
      [user_id, feedback]
    );

    await connection.end();
    res.status(200).json({ mensaje: 'Feedback enviado correctamente', id: result.insertId });
  } catch (error) {
    console.error('Error en submitFeedback:', error);
    res.status(500).json({ mensaje: 'Error al enviar feedback', error: error.message });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const connection = await sql();
    const [rows] = await connection.query(`
      SELECT pf.*, u.full_name as name, u.email, u.profile_picture
      FROM pilot_feedback pf
      LEFT JOIN users u ON pf.user_id = u.id
      ORDER BY pf.created_at DESC
    `);
    await connection.end();
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error en getAllFeedback:', error);
    res.status(500).json({ mensaje: 'Error al obtener feedback', error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const connection = await sql();
    const { id } = req.params;

    const [result] = await connection.query(
      'DELETE FROM pilot_feedback WHERE id = ?',
      [id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Feedback no encontrado' });
    }

    res.status(200).json({ mensaje: 'Feedback eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteFeedback:', error);
    res.status(500).json({ mensaje: 'Error al eliminar feedback', error: error.message });
  }
};
