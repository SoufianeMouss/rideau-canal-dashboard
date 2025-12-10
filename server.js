require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { CosmosClient } = require("@azure/cosmos");

const app = express();
app.use(cors());
app.use(express.static("public"));

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const container = database.container(process.env.COSMOS_CONTAINER);

/**
 * Get latest aggregation per location (for cards).
 */
app.get("/api/latest", async (req, res) => {
  try {
    const query = {
      query: `
        SELECT TOP 1 * FROM c
        WHERE c.location = @location
        ORDER BY c.windowEnd DESC
      `,
      parameters: [{ name: "@location", value: "" }],
    };

    const locations = ["DowsLake", "FifthAvenue", "NAC"];
    const results = {};

    for (const loc of locations) {
      query.parameters[0].value = loc;
      const { resources } = await container.items
        .query(query, { enableCrossPartitionQuery: true })
        .fetchAll();

      if (resources.length > 0) {
        const doc = resources[0];

        // 🔹 Recalculate safetyStatus here instead of trusting Cosmos
        const avgIce = Number(doc.avgIceThicknessCm);
        const avgSurface = Number(doc.avgSurfaceTempC);

        let safetyStatus;
        if (avgIce >= 30 && avgSurface <= -2) {
          safetyStatus = "Safe";
        } else if (avgIce >= 25 && avgSurface <= 0) {
          safetyStatus = "Caution";
        } else {
          safetyStatus = "Unsafe";
        }

        // 🔹 Normalize the object we send to the frontend
        results[loc] = {
          location: doc.location,
          windowEnd: doc.windowEnd,
          avgIceThicknessCm: avgIce,
          minIceThicknessCm: Number(doc.minIceThicknessCm),
          maxIceThicknessCm: Number(doc.maxIceThicknessCm),
          avgSurfaceTempC: avgSurface,
          minSurfaceTempC: Number(doc.minSurfaceTempC),
          maxSurfaceTempC: Number(doc.maxSurfaceTempC),
          maxSnowAccumulationCm: Number(doc.maxSnowAccumulationCm),
          avgExternalTempC: Number(doc.avgExternalTempC),
          readingCount: Number(doc.readingCount),
          // 👇 Now guaranteed to be a plain string
          safetyStatus,
        };
      }
    }

    res.json(results);
  } catch (err) {
    console.error("Error in /api/latest:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



/**
 * Get last hour history per location (for charts).
 */
app.get("/api/history", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const query = {
      query: `
        SELECT * FROM c
        WHERE c.windowEnd >= @since
        ORDER BY c.windowEnd ASC
      `,
      parameters: [
        { name: "@since", value: oneHourAgo.toISOString() }
      ],
    };

    const { resources } = await container.items
      .query(query, { enableCrossPartitionQuery: true })
      .fetchAll();

    res.json(resources);
  } catch (err) {
    console.error("Error in /api/history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dashboard server running on port ${port}`);
});
