import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const apiKey = "d855022feded1934f8590f123da7b216";

app.get("/", (req, res) => {
  res.send("Weather app backend API :)");
});

app.get("/api/geo", async (req, res) => {
  const city = req.query.city || "Gliwice";

  const geoUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

  try {
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
      throw new Error("Nie udało się pobrać danych geolokalizacji.");
    }

    const geoData = await geoResponse.json();
    const lat = geoData.coord.lat;
    const lon = geoData.coord.lon;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      throw new Error("Nie udało się pobrać prognozy pogody.");
    }

    const forecastData = await forecastResponse.json();

    // Dodaj nazwę miasta do forecastData — żeby frontend miał dostęp
    forecastData.city = {
      ...forecastData.city,
      name: geoData.name,
    };

    res.status(200).json(forecastData);
  } catch (error) {
    console.error("Błąd w API:", error.message);
    res.status(500).json({ error: error.message }); // <- Zmienione z `send` na `json`
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({});
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port: ${port}`));
