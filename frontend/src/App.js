import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetails from "./pages/MovieDetails.jsx";
import Movies from './pages/Movies';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingHistory from "./pages/BookingHistory";
import Events from "./pages/Events";
import Plays from "./pages/Plays";
import Sports from "./pages/Sports";
import Success from "./pages/Success";


export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/success" element={<Success />} />
          <Route path="/bookings" element={<BookingHistory />} />
          <Route path="/events" element={<Events />} />
          <Route path="/plays" element={<Plays />} />
          <Route path="/sports" element={<Sports />} />
        </Routes>
      </main>
    </>
  );
}
