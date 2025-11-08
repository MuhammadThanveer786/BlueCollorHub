"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import indiaStatesWithDistricts from "@/data/southStatesWithDistricts";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState(Object.keys(indiaStatesWithDistricts)[0]);
  const [district, setDistrict] = useState(indiaStatesWithDistricts[state][0]);
  const router = useRouter();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
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
    setDistrict(indiaStatesWithDistricts[selectedState][0]);
  };

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Location Selectors */}
      <div className="flex items-center gap-2 bg-white border border-black rounded-lg p-2 shadow-sm flex-shrink-0">
        <FaMapMarkerAlt className="text-black text-lg ml-1" />

        <select
          value={state}
          onChange={handleStateChange}
          className="px-3 py-1 rounded-lg border border-black focus:outline-none focus:ring-1 focus:ring-black w-32 text-sm"
        >
          {Object.keys(indiaStatesWithDistricts).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="px-3 py-1 rounded-lg border border-black focus:outline-none focus:ring-1 focus:ring-black w-32 text-sm ml-2"
        >
          {indiaStatesWithDistricts[state].map((dist) => (
            <option key={dist} value={dist}>
              {dist}
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div className="relative flex-1 max-w-2xl">
 {/* 👈 increased width */}
        <input
          type="text"
          placeholder="Search for posts, users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          className="border border-black rounded-lg pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-500"
        />
        <FaSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer"
          onClick={handleSearch}
        />
      </div>
    </div>
  );
}