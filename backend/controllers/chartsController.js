import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateCharts = async (req, res) => {
    try {
        const { topViewed, topPurchased } = req.body;
        
        // Datos para pasar al script de Python
        const inputData = {
            topViewed: topViewed || [],
            topPurchased: topPurchased || []
        };
        
        // Ejecutar script de Python (ruta corregida para ir al directorio backend)
        const pythonScript = path.join(__dirname, '..', 'generate_charts.py');
        const pythonProcess = spawn('python', [pythonScript]);
        
        let outputData = '';
        let errorData = '';
        
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
        
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Error en script de Python:', errorData);
                return res.status(500).json({ 
                    mensaje: 'Error al generar gráficos', 
                    error: errorData 
                });
            }
            
            try {
                const result = JSON.parse(outputData);
                res.status(200).json({ success: true, charts: result });
            } catch (parseError) {
                console.error('Error al parsear salida de Python:', parseError);
                res.status(500).json({ 
                    mensaje: 'Error al procesar resultado de gráficos', 
                    error: parseError.message 
                });
            }
        });
        
    } catch (error) {
        console.error('Error en generateCharts:', error);
        res.status(500).json({ 
            mensaje: 'Error al generar gráficos', 
            error: error.message 
        });
    }
};
