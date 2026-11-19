import sql from '../config/db.js';

export const getAllWines = async (req, res) => {
    try {
        const connection = await sql();
        
        // Consultar las 3 tablas (solo vinos visibles)
        const [redWines] = await connection.query("SELECT * FROM red_wine WHERE hidden = 0 OR hidden IS NULL");
        const [whiteWines] = await connection.query("SELECT * FROM white_wine WHERE hidden = 0 OR hidden IS NULL");
        const [roseWines] = await connection.query("SELECT * FROM rose_wine WHERE hidden = 0 OR hidden IS NULL");

        // Cerrar conexión
        await connection.end();

        // Mapear y unificar los datos con IDs únicos
        const allWines = [
            ...redWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `red_${wine.ID || wine.id}`, // ID único para tintos
                originalId: wine.ID || wine.id,
                wineType: 'tinto',
                type: 'tinto',
                varietal: wine.cepa
            })),
            ...whiteWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `white_${wine.ID || wine.id}`, // ID único para blancos
                originalId: wine.ID || wine.id,
                wineType: 'blanco',
                type: 'blanco',
                varietal: wine.cepa
            })),
            ...roseWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `rose_${wine.ID || wine.id}`, // ID único para espumantes
                originalId: wine.ID || wine.id,
                wineType: 'espumante',
                type: 'espumante',
                varietal: wine.cepa
            }))
        ];

        // Transformar campos de texto a arrays si existen
        const transformedWines = allWines.map(wine => ({
            ...wine,
            notes: wine.notes ? (Array.isArray(wine.notes) ? wine.notes : wine.notes.split(',').map(n => n.trim())) : [],
            pairing: wine.pairing ? (Array.isArray(wine.pairing) ? wine.pairing : wine.pairing.split(',').map(p => p.trim())) : [],
            featured: wine.featured === 1 || wine.featured === true
        }));

        res.status(200).json(transformedWines);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener vinos', error: error.message });
    }
};

export const getAllWinesAdmin = async (req, res) => {
    try {
        const connection = await sql();
        
        // Consultar las 3 tablas (todos los vinos, incluyendo ocultos)
        const [redWines] = await connection.query("SELECT * FROM red_wine");
        const [whiteWines] = await connection.query("SELECT * FROM white_wine");
        const [roseWines] = await connection.query("SELECT * FROM rose_wine");

        // Cerrar conexión
        await connection.end();

        // Mapear y unificar los datos con IDs únicos
        const allWines = [
            ...redWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `red_${wine.ID || wine.id}`, // ID único para tintos
                originalId: wine.ID || wine.id,
                wineType: 'tinto',
                type: 'tinto',
                varietal: wine.cepa
            })),
            ...whiteWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `white_${wine.ID || wine.id}`, // ID único para blancos
                originalId: wine.ID || wine.id,
                wineType: 'blanco',
                type: 'blanco',
                varietal: wine.cepa
            })),
            ...roseWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `rose_${wine.ID || wine.id}`, // ID único para espumantes
                originalId: wine.ID || wine.id,
                wineType: 'espumante',
                type: 'espumante',
                varietal: wine.cepa
            }))
        ];

        // Transformar campos de texto a arrays si existen
        const transformedWines = allWines.map(wine => ({
            ...wine,
            notes: wine.notes ? (Array.isArray(wine.notes) ? wine.notes : wine.notes.split(',').map(n => n.trim())) : [],
            pairing: wine.pairing ? (Array.isArray(wine.pairing) ? wine.pairing : wine.pairing.split(',').map(p => p.trim())) : [],
            featured: wine.featured === 1 || wine.featured === true
        }));

        res.status(200).json(transformedWines);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener vinos', error: error.message });
    }
};

// Búsqueda de vinos con autocompletado
export const searchWines = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(200).json([]);
        }

        const connection = await sql();
        const searchTerm = `%${q}%`;
        
        // Buscar en las 3 tablas (solo campos que existen y vinos visibles)
        const [redWines] = await connection.query(
            "SELECT * FROM red_wine WHERE (name LIKE ? OR winery LIKE ? OR cepa LIKE ?) AND (hidden = 0 OR hidden IS NULL) LIMIT 10",
            [searchTerm, searchTerm, searchTerm]
        );
        const [whiteWines] = await connection.query(
            "SELECT * FROM white_wine WHERE (name LIKE ? OR winery LIKE ? OR cepa LIKE ?) AND (hidden = 0 OR hidden IS NULL) LIMIT 10",
            [searchTerm, searchTerm, searchTerm]
        );
        const [roseWines] = await connection.query(
            "SELECT * FROM rose_wine WHERE (name LIKE ? OR winery LIKE ? OR cepa LIKE ?) AND (hidden = 0 OR hidden IS NULL) LIMIT 10",
            [searchTerm, searchTerm, searchTerm]
        );

        await connection.end();

        // Mapear y unificar los datos con IDs únicos
        const allWines = [
            ...redWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `red_${wine.ID || wine.id}`, // ID único para tintos
                originalId: wine.ID || wine.id,
                wineType: 'tinto',
                type: 'tinto',
                varietal: wine.cepa,
                slug: wine.slug || wine.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            })),
            ...whiteWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `white_${wine.ID || wine.id}`, // ID único para blancos
                originalId: wine.ID || wine.id,
                wineType: 'blanco',
                type: 'blanco',
                varietal: wine.cepa,
                slug: wine.slug || wine.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            })),
            ...roseWines.map(wine => ({
                ...wine,
                ID: undefined,
                id: `rose_${wine.ID || wine.id}`, // ID único para espumantes
                originalId: wine.ID || wine.id,
                wineType: 'espumante',
                type: 'espumante',
                varietal: wine.cepa,
                slug: wine.slug || wine.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            }))
        ];

        res.status(200).json(allWines);
    } catch (error) {
        console.error('Error al buscar vinos:', error);
        res.status(500).json({ mensaje: 'Error al buscar vinos', error: error.message });
    }
};
