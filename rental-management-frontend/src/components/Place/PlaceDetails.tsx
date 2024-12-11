import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Review } from "../../types";
import axios from "axios";

import ReservationModal from "../ReservationModal";

interface PlaceDetailsProps {
  id: number;
  roomsCount: number;
  size: number;
  address: string;
  description: string;
  price: number;
}

const PlaceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetailsProps | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/Places/${id}`
        );
        setPlace(response.data);
      } catch (error) {
        console.error("Place details", error);
        if (axios.isAxiosError(error)) {
          setError(
            "An error occurred while fetching the place details. " +
              error.message
          );
        } else {
          setError("An error occurred while fetching the place details.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/Places/${id}/Reviews`
        );
        console.log(response.data);
        setReviews(response.data);
      } catch (error) {
        console.error("Reviews", error);
        if (axios.isAxiosError(error)) {
          setError(
            "An error occurred while fetching the reviews. " + error.message
          );
        } else {
          setError("An error occurred while fetching the reviews.");
        }
      }
    };

    fetchPlace();
    fetchReviews();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Oh no! {error}</div>;
  }

  const pricePerSquareMeter = place ? (place.price / place.size).toFixed(2) : 0;
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white shadow-md rounded-md">
      {place && (
        <>
          <h1 className="text-xl font-bold text-gray-800 mb-2 text-left">
            {place.address}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Image Section */}
            <div className="lg:col-span-2">
              <div className="relative">
                <img
                  src="https://via.placeholder.com/600x400" // TODO: Replace with actual image link
                  alt="Main property"
                  className="w-full rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-gray-900 text-white px-2 py-1 rounded-md flex items-center">
                  <svg
                    className="w-4 h-4 text-yellow-300"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 22 20"
                  >
                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                  </svg>
                  <span className="text-sm font-semibold ml-1">
                    {averageRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="mt-4 lg:mt-0 lg:col-span-1 text-left">
              <div className="text-2xl font-semibold mb-2">
                <p className="text-red-600">
                  {place.price} €{" "}
                  <span className="text-sm text-gray-600">
                    ({pricePerSquareMeter} €/m²)
                  </span>
                </p>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <b>Area:</b> {place.size} m²
                </li>
                <li>
                  <b>Price per month:</b> {place.price} €
                </li>
                <li>
                  <b>Number of rooms:</b> {place.roomsCount}
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-4">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  onClick={() => setIsModalOpen(true)}
                >
                  Reserve
                </button>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-8 lg:mt-0 lg:col-span-3 text-left">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Reviews</h2>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="mb-4 max-w-md">
                      <p className="text-sm text-gray-600">
                        <b>{review.user?.userName}</b> - {review.rating} ⭐
                      </p>
                      <p className="text-sm text-gray-600 break-words">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No reviews available.</p>
              )}
            </div>
          </div>
        </>
      )}
      <ReservationModal
        placeId={place?.id || 0}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PlaceDetails;
