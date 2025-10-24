require("dotenv").config();
console.log("Loaded PORT from .env:", process.env.PORT);
console.log("Loaded MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Missing");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ MOVE THIS LINE ABOVE app.use
const authRoutes = require("./routes/auth");

// Auth routes
app.use("/api/auth", authRoutes);

// Serve static files (if any)
app.use(express.static("public"));

// Test route
app.get("/", (req, res) => {
  res.send("✅ Stripe backend is running successfully!");
});

// Payment route
app.post("/payment", async (req, res) => {
  try {
    const { amount, movieTitle } = req.body;
    const Booking = require("./models/Booking");
    console.log("Creating payment for", movieTitle, "₹" + amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: movieTitle || "Movie Ticket" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Add booking route (after payment)
app.post("/api/bookings", async (req, res) => {
  try {
    const Booking = require("./models/Booking");
    const { userId, movieTitle, amount } = req.body;

    if (!userId || !movieTitle || !amount) {
      return res.status(400).json({ message: "Missing booking details" });
    }

    const booking = new Booking({ userId, movieTitle, amount });
    await booking.save();

    console.log("✅ Booking saved:", booking);
    res.status(201).json({ message: "Booking stored", booking });
  } catch (err) {
    console.error("❌ Booking save error:", err);
    res.status(500).json({ message: "Failed to save booking" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
