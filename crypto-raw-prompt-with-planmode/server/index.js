const express = require("express");
const cors = require("cors");
const portfolioRoutes = require("./routes/portfolio");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use("/api", portfolioRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
