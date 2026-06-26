import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { useState, useEffect } from "react";

const Rating = () => {
  const [animatedRating, setAnimatedRating] = useState(0);
  const [animatedComplaint, setAnimatedComplaint] = useState(0);
  const [animatedDelivery, setAnimatedDelivery] = useState(0);

  useEffect(() => {
    // Animate the numbers when component mounts
    const ratingInterval = setInterval(() => {
      setAnimatedRating((prev) => {
        const increment = 4.6 / 20;
        return prev + increment > 4.6 ? 4.6 : prev + increment;
      });
    }, 50);

    const complaintInterval = setInterval(() => {
      setAnimatedComplaint((prev) => (prev >= 2 ? 2 : prev + 1));
    }, 100);

    const deliveryInterval = setInterval(() => {
      setAnimatedDelivery((prev) => (prev >= 95 ? 95 : prev + 5));
    }, 50);

    return () => {
      clearInterval(ratingInterval);
      clearInterval(complaintInterval);
      clearInterval(deliveryInterval);
    };
  }, []);

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(4.6);
    const hasHalfStar = 4.6 % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<AiFillStar key={i} className="text-yellow-400 w-5 h-5" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <AiOutlineStar className="text-gray-300 w-5 h-5 absolute" />
            <div className="overflow-hidden w-1/2">
              <AiFillStar className="text-yellow-400 w-5 h-5" />
            </div>
          </div>
        );
      } else {
        stars.push(<AiOutlineStar key={i} className="text-gray-300 w-5 h-5" />);
      }
    }
    return stars;
  };

  return (
    <div className="font-text pt-6 pl-4">
      <p className="pb-4 text-base font-semibold text-black">
        Customer Satisfaction
      </p>
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100 transition-all duration-300 hover:shadow-xl">
        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex">{renderStars()}</div>
          <p className="text-2xl font-bold text-gray-900">
            {animatedRating.toFixed(1)}
            <span className="text-base font-medium text-gray-500"> / 5</span>
          </p>
        </div>

        {/* Review Count */}
        <div className="text-sm text-gray-500">
          Based on <span className="font-semibold">428 reviews</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-[#EE1E21]/5 rounded-xl text-center border border-[#EE1E21]/10 transition-all duration-300 hover:scale-105">
            <p className="text-lg font-semibold text-[#EE1E21]">
              {animatedComplaint}%
            </p>
            <p className="text-gray-600 text-xs">Complaint Rate</p>
            <div className="w-full bg-[#EE1E21]/10 rounded-full h-1.5 mt-2">
              <div
                className="bg-[#EE1E21] h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${animatedComplaint}%` }}
              ></div>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100 transition-all duration-300 hover:scale-105">
            <p className="text-lg font-semibold text-green-600">
              {animatedDelivery}%
            </p>
            <p className="text-gray-600 text-xs">Successful Delivery</p>
            <div className="w-full bg-green-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-green-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${animatedDelivery}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>5 stars</span>
            <span>72%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-400 h-1.5 rounded-full"
              style={{ width: "72%" }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-1 mt-2">
            <span>4 stars</span>
            <span>18%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-400 h-1.5 rounded-full"
              style={{ width: "18%" }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-1 mt-2">
            <span>3 stars</span>
            <span>6%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-400 h-1.5 rounded-full"
              style={{ width: "6%" }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-1 mt-2">
            <span>2 stars</span>
            <span>3%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-400 h-1.5 rounded-full"
              style={{ width: "3%" }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-1 mt-2">
            <span>1 star</span>
            <span>1%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-400 h-1.5 rounded-full"
              style={{ width: "1%" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rating;
