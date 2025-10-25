require("dotenv").config();
console.log("Loaded PORT from .env:", process.env.PORT);
console.log("Loaded MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Missing");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ✅ CORS middleware (before everything else)
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// ✅ Raw body must be available only for /webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next(); // Skip JSON parsing for Stripe webhook
  } else {
    express.json()(req, res, next);
  }
});

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ Auth routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Stripe backend is running successfully!");
});

// ✅ Payment route
app.post("/payment", async (req, res) => {
  try {
    const { amount, movieTitle } = req.body;
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
      success_url: `${FRONTEND_URL}/success`,
      cancel_url: `${FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Manual booking save route (still valid)
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

// ✅ Stripe Webhook route (must come AFTER middleware fix)
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Payment confirmed for session:", session.id);

    const Booking = require("./models/Booking");
    const newBooking = new Booking({
      userId: session.client_reference_id || "guest",
      movieTitle: session.metadata?.movieTitle || "Unknown Movie",
      amount: session.amount_total / 100,
    });

    newBooking.save().then(() => console.log("✅ Booking stored via webhook"));
  }

  res.json({ received: true });
});

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
