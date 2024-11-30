const app = require('./director')

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Director service is running on port ${PORT}`);
});
