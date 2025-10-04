const express = require('express');
const cors = require('cors');
const certificateRoutes = require('./routes/certificate');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/certificate', certificateRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));