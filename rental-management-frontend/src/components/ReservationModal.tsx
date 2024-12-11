import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

interface ReservationModalProps {
  placeId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  placeId,
  isOpen,
  onClose,
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reservedDates, setReservedDates] = useState<Date[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchReservedDates = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/Places/${placeId}/Reservations`
        );
        const reservations = response.data;
        const dates = reservations.flatMap((reservation: any) => {
          const start = new Date(reservation.startDate);
          const end = new Date(reservation.endDate);
          const datesArray = [];
          for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            datesArray.push(new Date(d));
          }
          return datesArray;
        });
        setReservedDates(dates);
      } catch (error) {
        console.error(error);
        setError("An error occurred while fetching reserved dates.");
      }
    };

    if (isOpen) {
      fetchReservedDates();
    }
  }, [isOpen, placeId]);

  const handleReserve = async () => {
    if (!startDate || !endDate) {
      setError("Please select a valid date range.");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/Places/${placeId}/Reservations`,
        {
          startDate,
          endDate,
        }
      );
      onClose();
    } catch (error) {
      console.error(error);
      setError("An error occurred while making the reservation");
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-lg shadow-lg p-6 z-10 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Reserve Place</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Date Range</label>
          <DatePicker
            selected={startDate}
            onChange={(dates) => {
              const [start, end] = dates as [Date, Date];
              setStartDate(start);
              setEndDate(end);
            }}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            inline
            excludeDates={reservedDates}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md"
            onClick={handleReserve}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
