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
        
        // TÁCTICA 1: Buscar en el párrafo lineal (A prueba de columnas del Juzgado)
        // Busca la palabra "contra", y pilla todo el texto en MAYÚSCULAS hasta la coma o "representado"
        const regexParrafo = /contra\s+([A-ZÁÉÍÓÚÑ\s,Y]+?)(?:,|\s+representado|\s+en reclamaci|\.\s)/;
        const matchParrafo = textoFiltro.match(regexParrafo);
        
        if (matchParrafo && matchParrafo[1].trim().length > 4) {
            nombreEjecutado = matchParrafo[1].trim();
        } 
        else {
            // TÁCTICA 2: Plan B (Buscar en la tabla por si el párrafo no dice "contra")
            const textoEncabezado = textoFiltro.substring(0, 2000);
            const regexTabla = /Ejecutado[\s:]+([\s\S]{5,200}?)(?=\s+(?:Interviniente|EDICTO|HAGO SABER|D\.\/DÑA))/i;
            const matchTabla = textoEncabezado.match(regexTabla);
            
            if (matchTabla) {
                let limpieza = matchTabla[1].replace(/Ejecutado/gi, ' ').replace(/\s+/g, ' ').trim();
                // Filtro para que no se trague avisos legales
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
