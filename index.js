const express = require('express');
const axios = require('axios');
const pdf = require('pdf-parse');
const app = express();

app.use(express.json());

app.post('/extraer-ejecutado', async (req, res) => {
    try {
        const urlPdf = req.body.url;
        
        const response = await axios.get(urlPdf, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const data = await pdf(response.data);
        const textoFiltro = data.text;
        
        // EL TRUCO: Cortamos los primeros 2000 caracteres para obligarle a mirar SOLO en la cabecera (donde está la tabla)
        const textoEncabezado = textoFiltro.substring(0, 2000);
        
        // Buscamos Ejecutado y limitamos la captura a 150 caracteres máximo para que no se trague párrafos
        const regex = /Ejecutado[\s:]+([\s\S]{5,150}?)(?=\s+(?:Interviniente|Abogado|Procurador|EDICTO|HAGO SABER|\n\s*\n))/i;
        const match = textoEncabezado.match(regex);
        
        let nombreEjecutado = "No localizado";
        if (match) {
            // Limpiamos repeticiones y espacios extra
            nombreEjecutado = match[1].replace(/Ejecutado/gi, ' ').replace(/\s+/g, ' ').trim();
            
            // Filtro de seguridad: Si por algún casual pilla texto de leyes, lo descartamos
            if (nombreEjecutado.includes(" o el ") || nombreEjecutado.length > 120) {
                nombreEjecutado = "Lectura compleja (Revisar PDF manual)";
            }
        }
        
        res.json({ ejecutado: nombreEjecutado });
        
    } catch (error) {
        res.status(500).json({ error: "Fallo al procesar el documento" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
