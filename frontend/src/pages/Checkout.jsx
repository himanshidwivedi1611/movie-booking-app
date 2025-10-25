import React from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Checkout() {
  const booking = JSON.parse(sessionStorage.getItem("mb_booking") || "null");
  if (!booking) return <div>No booking found.</div>;

  const total = booking.seats.length * booking.pricePerSeat;

  const handlePay = async () => {
    try {
      // ✅ Step 1: Save booking info before payment
      const lastBooking = {
        userId: "guest", // later replace with logged-in user ID or email if available
        movieTitle: booking.title,
        amount: total,
        seats: booking.seats,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        id: Date.now(),
      };
      localStorage.setItem("lastBooking", JSON.stringify(lastBooking));

      // ✅ Step 2: Continue Stripe payment flow
      const res = await fetch(`${API_URL}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          movieTitle: booking.title,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment session creation failed.");
        console.error(data);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment request failed.");
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <p><strong>{booking.title}</strong></p>
      <p>Seats: {booking.seats.join(", ")}</p>
      <p>Total: ₹{total}</p>
      <button className="btn" onClick={handlePay}>
        Pay ₹{total}
      </button>
    </div>
  );
}
