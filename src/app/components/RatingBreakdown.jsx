// src/app/components/RatingBreakdown.jsx
import React from 'react';
import { FaStar } from 'react-icons/fa';

const RatingBreakdown = ({ averageRating, totalRatings, totalReviews, ratingDistribution }) => {
    
    // 🌟 FIX: Use the actual props, falling back to 0 or an empty object 
    const finalTotalRatings = totalRatings || 0;
    const finalAverageRating = averageRating || 0;
    const finalTotalReviews = totalReviews || 0;
    
    // Ensure ratingDistribution is an object with rating keys, defaulting to 0 counts
    const finalDistribution = ratingDistribution && Object.keys(ratingDistribution).length > 0 
        ? ratingDistribution 
        : { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

    if (finalTotalRatings === 0) {
        return (
            <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
                No ratings yet for this worker.
            </div>
        );
    }

    // --- GAUGE LOGIC ---
    const MIN_RATING = 0;
    const MAX_RATING = 5;
    const GAUGE_SIZE = 180;
    const STROKE_WIDTH = 10; 

    const RATING_TO_DEGREES = 180 / (MAX_RATING - MIN_RATING);
    const normalizedRating = Math.min(MAX_RATING, Math.max(MIN_RATING, finalAverageRating));
    // -90 degrees (left) to 90 degrees (right) for CSS transform
    const rotationDegrees = (normalizedRating * RATING_TO_DEGREES) - 90; 

    // Color segment logic for the text
    const getScoreColor = (score) => {
        if (score >= 4.0) return 'text-green-600'; 
        if (score >= 2.0) return 'text-yellow-600'; 
        return 'text-red-600'; 
    };

    // --- DISTRIBUTION BAR LOGIC ---
    // Sort stars from 5 down to 1
    const ratingBars = Object.entries(finalDistribution)
        .sort(([a], [b]) => b - a)
        .map(([star, count]) => ({
            star: parseInt(star),
            count: Number(count) || 0,
            // Calculate percentage only if total ratings > 0
            percentage: finalTotalRatings > 0 ? ((Number(count) || 0) / finalTotalRatings) * 100 : 0,
        }));
    
    const getBarColor = (star) => {
        if (star >= 4) return 'bg-green-600';
        if (star === 3) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // --- SVG PATH COORDINATES (Kept as is) ---
    const R = 45; 
    const CY = 50; 
    const PATH_START = 5; 
    const PATH_END = 95; 
    const ARC_Y = 10; 
    const P2_X = 30; 
    const P4_X = 70; 

    return (
        <div className="p-4 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-4">Ratings & Reviews</h3>
            
            {/* 🌟 CIBIL-STYLE GAUGE METER SECTION */}
            <div className="flex flex-col items-center mb-6 p-4 border rounded-lg bg-white">
                <p className="text-base font-semibold text-gray-700 mb-4">
                    Overall Worker Score
                </p>

                {/* Gauge Meter Container */}
                <div 
                    className="relative" 
                    style={{ width: `${GAUGE_SIZE}px`, height: `${GAUGE_SIZE / 2 + 10}px` }} 
                >
                    {/* SVG Semicircle (The Meter Itself) */}
                    <svg
                        viewBox="0 0 100 60" 
                        className="absolute bottom-0"
                    >
                        {/* Red Segment (0 - 2.0) */}
                        <path
                            d={`M ${PATH_START} ${CY} A ${R} ${R} 0 0 1 ${P2_X} ${ARC_Y}`}
                            fill="none"
                            stroke="#EF4444" 
                            strokeWidth={STROKE_WIDTH}
                        />
                        {/* Yellow Segment (2.0 - 4.0) */}
                        <path
                            d={`M ${P2_X} ${ARC_Y} A ${R} ${R} 0 0 1 ${P4_X} ${ARC_Y}`}
                            fill="none"
                            stroke="#F59E0B" 
                            strokeWidth={STROKE_WIDTH}
                        />
                        {/* Green Segment (4.0 - 5.0) */}
                        <path
                            d={`M ${P4_X} ${ARC_Y} A ${R} ${R} 0 0 1 ${PATH_END} ${CY}`}
                            fill="none"
                            stroke="#10B981" 
                            strokeWidth={STROKE_WIDTH}
                        />
                    </svg>

                    {/* Needle/Arrow */}
                    <div 
                        className="absolute origin-bottom transition-transform duration-1000 ease-in-out"
                        style={{ 
                            width: '2px',
                            height: `${GAUGE_SIZE / 2 - STROKE_WIDTH}px`, 
                            bottom: '0px',
                            left: '50%',
                            backgroundColor: 'black',
                            transform: `translateX(-50%) rotate(${rotationDegrees}deg)`, 
                            zIndex: 10,
                        }}
                    >
                        {/* Needle Tip/Base (Pivot Point) */}
                        <div className="absolute w-4 h-4 rounded-full bg-black -bottom-2 -left-2"></div>
                    </div>

                    {/* Score Text */}
                    <div 
                        className={`absolute left-1/2 transform -translate-x-1/2 font-extrabold text-3xl ${getScoreColor(finalAverageRating)}`}
                        style={{ bottom: '25px' }} 
                    >
                        {finalAverageRating.toFixed(1)}
                    </div>
                </div>
                {/* End Gauge Meter Container */}


                <p className="text-sm text-gray-600 mt-8 text-center">
                    **{finalTotalRatings.toLocaleString()}** Ratings & **{finalTotalReviews.toLocaleString()}** Reviews
                </p>
            </div>
            {/* END GAUGE METER SECTION */}


            {/* RATING DISTRIBUTION BARS */}
            <div className="space-y-3 pt-4">
                <h4 className="text-lg font-bold text-gray-800 border-b pb-2">Rating Distribution</h4>
                {ratingBars.map(bar => (
                    <div key={bar.star} className="flex items-center gap-2">
                        {/* Star Label */}
                        <div className="w-12 flex items-center justify-end text-sm font-medium text-gray-700 whitespace-nowrap">
                            {bar.star}★
                        </div>
                        
                        {/* Bar Visualization */}
                        <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                            <div 
                                className={`h-full ${getBarColor(bar.star)} transition-all duration-700 ease-out`} 
                                style={{ width: `${bar.percentage}%` }}
                            ></div>
                        </div>

                        {/* Count */}
                        <div className="w-12 text-right text-sm text-gray-700">
                            {bar.count.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
            {/* END RATING DISTRIBUTION BARS */}
        </div>
    );
};

export default RatingBreakdown;