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
        
        const regex = /Ejecutado[\s\S]*?(?:Interviniente:|Abogado:|Procurador:)?[\s]+([A-Z\s\.,]+S\.L\.|[A-Z\s\.,]+S\.A\.|[A-Z\s,]+)/i;
        const match = textoFiltro.match(regex);
        
        const nombreEjecutado = match ? match[1].trim() : "No localizado";
        
        res.json({ ejecutado: nombreEjecutado });
        
    } catch (error) {
        res.status(500).json({ error: "Fallo al procesar el documento" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
