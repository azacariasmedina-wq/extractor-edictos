const express = require('express');
const axios = require('axios');
const pdf = require('pdf-parse');
const app = express();

app.use(express.json());

app.post('/extraer-ejecutado', async (req, res) => {
    try {
        const urlPdf = req.body.url;
        
        // Aquí le metemos el disfraz (User-Agent) para que el BOE no bloquee
        const response = await axios.get(urlPdf, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const data = await pdf(response.data);
        const textoFiltro = data.text;
        
        const regex = /(?:Ejecutado\s+)([\s\S]+?)(?=\s+(?:Interviniente|Abogado|Procurador|EDICTO\b))/i;
        const match = textoFiltro.match(regex);
        
        let nombreEjecutado = "No localizado";
        if (match) {
            nombreEjecutado = match[1].replace(/Ejecutado/gi, '').replace(/\s+/g, ' ').trim();
        }
        
        res.json({ ejecutado: nombreEjecutado });
        
    } catch (error) {
        res.status(500).json({ error: "Fallo al procesar el documento" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
