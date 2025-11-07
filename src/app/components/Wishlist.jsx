"use client";
import { useState } from "react";

export default function Wishlist() {
  const [items, setItems] = useState([
    { id: 1, name: "Wishlist Item 1" },
    { id: 2, name: "Wishlist Item 2" },
  ]);

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      {items.length === 0 ? (
        <p>No items in your wishlist.</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-md shadow-sm flex justify-between items-center"
          >
            <span>{item.name}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
}
