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
        
        let nombreEjecutado = "No localizado";
        
        // TÁCTICA 1: Busca "contra" y coge absolutamente todo ( [^,]+? ) hasta la primera coma o palabra clave
        const regexParrafo = /contra\s+([^,]+?)(?:,|\s+representad[oa]s?|\s+en reclamaci|\s+por principal)/i;
        const matchParrafo = textoFiltro.match(regexParrafo);
        
        if (matchParrafo && matchParrafo[1].trim().length > 4) {
            let limpieza = matchParrafo[1].trim();
            // Evitamos que se trague tochos de texto por error
            if (limpieza.length < 150) {
                nombreEjecutado = limpieza;
            }
        } 
        
        // TÁCTICA 2: El Plan B clásico por si no dice "contra"
        if (nombreEjecutado === "No localizado") {
            const textoEncabezado = textoFiltro.substring(0, 3000);
            const regexTabla = /Ejecutado[\s:]+([\s\S]{5,150}?)(?=\s+(?:Interviniente|Abogado|Procurador|EDICTO|HAGO SABER|\n\s*\n))/i;
            const matchTabla = textoEncabezado.match(regexTabla);
            
            if (matchTabla) {
                let limpieza = matchTabla[1].replace(/Ejecutado/gi, ' ').replace(/\s+/g, ' ').trim();
                if (!limpieza.includes(" o el ") && limpieza.length < 150) {
                    nombreEjecutado = limpieza;
                }
            }
        }
        
        res.json({ ejecutado: nombreEjecutado });
        
    } catch (error) {
        res.status(500).json({ error: "Fallo al procesar el documento" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
