import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Utils
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (user) => {
  const { id, name } = user;

  return jwt.sign({ id, name }, process.env.AUTH_SECRET_KEY, {
    expiresIn: "1h",
  });
};

// Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { Login, Name, Password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { login: Login },
    });

    if (existingUser) {
      return res.status(400).json({ Login: "Login is already taken" });
    }

    const hashedPassword = await hashPassword(Password);

    const user = await prisma.user.create({
      data: {
        login: Login,
        name: Name,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { Login, Password } = req.body;

    const user = await prisma.user.findUnique({
      where: { login: Login },
      // select: {
      // id: true,
      // name: true,
      // },
    });

    if (!user) {
      return res.status(400).json({
        //sent global error
        error: "Invalid Credentials",
      });
    }

    const isMatch = await comparePassword(Password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        //sent global error
        error: "Invalid Credentials",
      });
    }

    const token = generateToken(user);

    res.json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user/history/add", async (req, res) => {
  const { weatherData, user } = req.body;

  try {
    const searchHistory = await prisma.searchHistory.create({
      data: {
        userId: user.id,
        weatherData,
      },
    });

    res.status(200).json({ searchHistory });
    res.status(200).json({ error: "User doesn't have home location" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user/home/remove", async (req, res) => {
  const { user } = req.body;

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        homeLocation: null,
      },
    });
    res.status(200).json({ message: "Home location removed successfully" });
  } catch (error) {
    console.warn(error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/user/home/set", async (req, res) => {
  const { city, user } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        homeLocation: city,
      },
    });

    res.status(200).json({ updatedUser });
  } catch (error) {
    console.warn(error);
    res.status(500).json({ error: error.message });
  }
});

const apiKey = "d855022feded1934f8590f123da7b216";

app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      throw new Error("Nie udało się pobrać prognozy pogody.");
    }

    const forecastData = await forecastResponse.json();

    res.status(200).json(forecastData);
  } catch (error) {
    console.error("Błąd w API:", error.message);
    res.status(500).json({ error: error.message }); // <- Zmienione z `send` na `json`
  }
});

app.get("/api/geo", async (req, res) => {
  const city = req.query.city;
  const geoUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

  try {
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
      throw new Error("Nie udało się pobrać danych geolokalizacji.");
    }

    const {
      coord: { lat, lon },
    } = await geoResponse.json();

    res.status(200).send({ lat, lon });
  } catch (error) {
    console.log({ error: "Nie udało się pobrać koordynatów" });
    res.status(500).json({ error: error.message });
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
