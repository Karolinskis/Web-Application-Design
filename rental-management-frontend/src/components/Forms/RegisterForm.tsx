import React, { useState } from "react";
import axios from "axios";

const RegisterForm: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoles = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setRoles(selectedRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Registering user", {
      userName,
      email,
      roles,
      password,
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/Authentication/Register`,
        {
          userName,
          email,
          roles,
          password,
        }
      );
      setSuccess("User registered successfully.");
      setError(null);
    } catch (error) {
      console.error("Register user", error);
      if (axios.isAxiosError(error)) {
        setError(
          "An error occurred while registering the user. " + error.message
        );
      } else {
        setError("An error occurred while registering the user.");
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
          Email:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="countries"
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          Roles
        </label>
        <select
          multiple
          value={roles}
          onChange={handleRoleChange}
          required
          id="countries"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        >
          <option value="Tennant">Tennant</option>
          <option value="Owner">Owner</option>
          <option value="Admin">Admin</option>
        </select>
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
        Register
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {success && <p className="mt-4 text-green-600">{success}</p>}
    </form>
  );
};

export default RegisterForm;
