import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import PlaceItem from "./components/Place/PlaceItem";
import axios from "axios";
import PlaceDetails from "./components/Place/PlaceDetails";
import Home from "./pages/Home";
import CreatePlaceForm from "./components/Forms/CreatePlaceForm";
import RegisterForm from "./components/Forms/RegisterForm";
import LoginForm from "./components/Forms/LoginForm";

interface Apartment {
  id: number;
  imageSrc: string;
  address: string;
  description: string;
  price: number;
  roomsCount: 5;
  size: 100;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mx-auto p-4 mt-20 max-w-7xl flex justify-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/places/:id" Component={PlaceDetails} />
            <Route path="/newPlace" element={<CreatePlaceForm />} />

            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
