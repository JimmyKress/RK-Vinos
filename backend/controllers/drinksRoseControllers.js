import sql from '../config/db.js';

//CONTROLLER GET
export const roseGET = async (req, res) => {
    try {
        const connection = await sql();
        const [rows] = await connection.query("SELECT * FROM rose_wine");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener vinos rosé', error: error.message });
    }
}

//CONTROLLER POST
export const rosePOST = async (req, res) => {
    try {
        const connection = await sql();
        const { name, type, cepa, price, stock, year, region, winery, volumeMl, description, notes, pairing, image, featured } = req.body;

        if (!name || !cepa) {
            return res.status(400).json({ mensaje: 'Nombre y cepa son requeridos' });
        }

        let validYear = year || null;
        if (validYear !== null) {
            const yearNum = Number(validYear);
            if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2155) {
                return res.status(400).json({ mensaje: 'El año debe estar entre 1900 y 2155' });
            }
            validYear = yearNum;
        }

        const [rows] = await connection.query(
            "INSERT INTO rose_wine (name, type, cepa, price, stock, year, region, winery, volumeMl, description, notes, pairing, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, type || null, cepa, price || 0, stock || 0, validYear, region || null, winery || null, volumeMl || 750, description || null, notes || null, pairing || null, image || null, featured ? 1 : 0]
        );

        res.status(200).json({ id: rows.insertId, ...rows });
    } catch (error) {
        console.error('Error en rosePOST:', error);
        res.status(500).json({ mensaje: 'Error al crear vino rosé', error: error.message });
    }
}

//CONTROLLER PUT
export const rosePUT = async (req, res) => {
    try {
        const connection = await sql();
        const { id, name, type, cepa, price, stock, year, region, winery, volumeMl, description, notes, pairing, image, featured } = req.body;

        // Convertir precio a float, reemplazando coma por punto
        const priceValue = price ? parseFloat(String(price).replace(',', '.')) : 0;

        let validYear = year || null;
        if (validYear !== null) {
            const yearNum = Number(validYear);
            if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2155) {
                return res.status(400).json({ mensaje: 'El año debe estar entre 1900 y 2155' });
            }
            validYear = yearNum;
        }

        const [rows] = await connection.query(
            "UPDATE rose_wine SET name = ?, type = ?, cepa = ?, price = ?, stock = ?, year = ?, region = ?, winery = ?, volumeMl = ?, description = ?, notes = ?, pairing = ?, image = ?, featured = ? WHERE id = ?",
            [name, type || null, cepa, priceValue, stock || 0, validYear, region || null, winery || null, volumeMl || 750, description || null, notes || null, pairing || null, image || null, featured ? 1 : 0, id]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en rosePUT:', error);
        res.status(500).json({ mensaje: 'Error al actualizar vino rosé', error: error.message });
    }
}

//CONTROLLER DELETE
export const roseDELETE = async (req, res) => {
    try {
        const connection = await sql();
        const { id } = req.params;
        const [rows] = await connection.query(
            "DELETE FROM rose_wine WHERE id = ?",
            [id]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar vino rosé', error: error.message });
    }
}

//CONTROLLER TOGGLE HIDDEN
export const toggleRoseHidden = async (req, res) => {
    try {
        const connection = await sql();
        const { id } = req.params;
        const { hidden } = req.body;
        
        const [rows] = await connection.query(
            "UPDATE rose_wine SET hidden = ? WHERE id = ?",
            [hidden ? 1 : 0, id]
        );

        res.status(200).json({ mensaje: 'Estado del vino actualizado', hidden: hidden ? 1 : 0 });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar estado del vino', error: error.message });
    }
}
