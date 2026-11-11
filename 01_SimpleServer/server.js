import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    console.log('Home page accessed');
    res.send('This is the Homepage');
});

app.get('/dashboard', (req, res) => {
    console.log('Dashboard accessed');
    res.send('Dashboard page');
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})