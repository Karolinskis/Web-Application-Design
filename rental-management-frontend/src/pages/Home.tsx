import axios from "axios";
import { useEffect, useState } from "react";
import { Place, Review } from "../types";
import PlaceItem from "../components/Place/PlaceItem";

function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/Places`
        );

        const placesData = response.data;

        // Fetch reviews for each place and calculate the average rating
        const placesWithRatings = await Promise.all(
          placesData.map(async (place: Place) => {
            const reviewsResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/Places/${place.id}/Reviews`
            );
            const reviews: Review[] = reviewsResponse.data;
            const averageRating =
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length;

            return {
              ...place,
              averageRating: isNaN(averageRating) ? 0 : averageRating,
            };
          })
        );

        setPlaces(placesWithRatings);
      } catch (error) {
        console.error(error);
        setError("An error occurred while fetching the data.");
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Oh no! {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {places.map((place) => (
        <PlaceItem
          key={place.id}
          title={place.address}
          price={place.price}
          averageRating={place.averageRating}
          link={`/places/${place.id}`}
        />
      ))}
    </div>
  );
}

export default Home;
