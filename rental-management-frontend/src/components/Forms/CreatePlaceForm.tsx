import React, { useState } from "react";
import axios from "axios";

const CreatePlaceForm: React.FC = () => {
  const [roomsCount, setRoomsCount] = useState<number>(0);
  const [size, setSize] = useState<number>(0);
  const [address, setAddress] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Creating place", {
      roomsCount,
      size,
      address,
      description,
      price,
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/Places`,
        {
          roomsCount,
          size,
          address,
          description,
          price,
        }
      );
      setSuccess("Place created successfully.");
      setError(null);
    } catch (error) {
      console.error("Create place", error);
      if (axios.isAxiosError(error)) {
        setError(
          "An error occurred while creating the place. " + error.message
        );
      } else {
        setError("An error occurred while creating the place.");
      }
      setSuccess(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-md"
    >
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Address:</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Description:
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Rooms Count:
        </label>
        <input
          type="number"
          value={roomsCount}
          onChange={(e) => setRoomsCount(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Size:</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Price:</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
      >
        Create Place
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {success && <p className="mt-4 text-green-600">{success}</p>}
    </form>
  );
};

export default CreatePlaceForm;
