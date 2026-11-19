const express = require("express");
const { lookupFood } = require("../services/foodLookupService");

const router = express.Router();

// GET /food-lookup?name=banana&limit=5
router.get("/", async (req, res) => {
  try {
    const name = req.query.name;
    const limit = Number(req.query.limit) || 5;

    const results = await lookupFood(name, limit);

    res.status(200).json({ results });
  } catch (error) {
    console.error("Food lookup error:", error);

    res.status(500).json({
      error: "Unable to look up food"
    });
  }
});

module.exports = router;
