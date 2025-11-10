"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import indiaStatesWithDistricts from "@/data/southStatesWithDistricts";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState(""); // initially empty
  const [district, setDistrict] = useState(""); // initially empty
  const router = useRouter();

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.append("query", searchQuery);

    // Add state & district only if both are selected
    if (state) params.append("state", state);
    if (district) params.append("district", district);

    router.push(`/dashboard/posts?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setState(selectedState);
    setDistrict(""); // reset district when state changes
  };

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Location Selectors */}
      <div className="flex items-center gap-2 bg-white border border-black rounded-lg p-2 shadow-sm flex-shrink-0">
        <FaMapMarkerAlt className="text-black text-lg ml-1" />

        {/* State Dropdown */}
        <select
          value={state}
          onChange={handleStateChange}
          className="px-3 py-1 rounded-lg border border-black focus:outline-none focus:ring-1 focus:ring-black w-40 text-sm"
        >
          <option value="">Select State</option>
          {Object.keys(indiaStatesWithDistricts).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* District Dropdown */}
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={!state} // disabled until state selected
          className={`px-3 py-1 rounded-lg border border-black focus:outline-none focus:ring-1 focus:ring-black w-40 text-sm ml-2 ${
            !state ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        >
          <option value="">Select District</option>
          {state &&
            indiaStatesWithDistricts[state]?.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
        </select>
      </div>

      {/* Search Input */}
    {/* Search Input */}
<div className="relative flex-1 ">
  <input
    type="text"
    placeholder='Search posts or skills (e.g., "plumbing", "bike mechanic")'
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onKeyDown={handleKeyPress}
    className="w-full border border-gray-400 rounded-l-md pl-4 pr-12 py-2 text-gray-700 focus:outline-none focus:ring-none focus:ring-black placeholder-gray-500 "
  />
  <button
    onClick={handleSearch}
    className="absolute right-0 top-0 h-full px-4 bg-black text-white rounded-r-md hover:bg-gray-800 transition cursor-pointer"
  >
    <FaSearch className="text-lg" />
  </button>
</div>

    </div>
  );
}
