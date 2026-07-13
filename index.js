const express = require('express');
const axios = require('axios');
const pdf = require('pdf-parse');
const app = express();

app.use(express.json());

app.post('/extraer-ejecutado', async (req, res) => {
    try {
        const urlPdf = req.body.url;
        
        const response = await axios.get(urlPdf, { responseType: 'arraybuffer' });
        const data = await pdf(response.data);
        const textoFiltro = data.text;
        
        // Expresión mejorada: para cuando vea Interviniente, Abogado o Procurador (tengan o no dos puntos)
        const regex = /(?:Ejecutado\s+)([\s\S]+?)(?=\s+(?:Interviniente|Abogado|Procurador|EDICTO\b))/i;
        const match = textoFiltro.match(regex);
        
        let nombreEjecutado = "No localizado";
        if (match) {
            // Limpiamos la basura: quitamos si repite la palabra "Ejecutado", quitamos saltos de línea y espacios
            nombreEjecutado = match[1].replace(/Ejecutado/gi, '').replace(/\s+/g, ' ').trim();
        }
        
        res.json({ ejecutado: nombreEjecutado });
        
    } catch (error) {
        res.status(500).json({ error: "Fallo al procesar el documento" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
