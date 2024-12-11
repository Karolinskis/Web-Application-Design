import React, { useState } from "react";
import axios from "axios";

const LoginForm: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Logging in user", {
      userName,
      password,
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/Authentication/Login`,
        {
          userName,
          password,
        }
      );
      setSuccess("User logged in successfully.");
      setError(null);
    } catch (error) {
      console.error("Login user", error);
      if (axios.isAxiosError(error)) {
        setError(
          "An error occurred while logging in the user. " + error.message
        );
      } else {
        setError("An error occurred while logging in the user.");
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
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Username:
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Password:
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
      >
        Login
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {success && <p className="mt-4 text-green-600">{success}</p>}
    </form>
  );
};

export default LoginForm;
