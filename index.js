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

const coordinates = {
  lat: "40.741895",
  lon: "-73.989308",
};

const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}`;

app.get("/", (req, res) => {
  res.send("Weather app backend API :)");
});

app.get("/api/weather", async (req, res) => {
  await fetch(apiUrl)
    .then((apiResponse) => {
      if (apiResponse.ok) {
        return apiResponse.json();
      }
    })
    .then((responseJson) => {
      res.status(200).send(responseJson);
    })
    .catch((error) => {
      res.status(500).send({ error });
    });
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
