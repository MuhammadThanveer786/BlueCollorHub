import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { success: false, message: 'Address is required' },
      { status: 400 }
    );
  }

  // This is the API key you stored in `.env.local`
  // It's safe to use `process.env` here because this code ONLY runs on the server.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API Key is missing from .env.local");
    return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
    );
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'OK') {
      const coordinates = data.results[0].geometry.location;
      // data.results[0].formatted_address
      return NextResponse.json({ success: true, coordinates });
    } else {
      // Handles cases like "ZERO_RESULTS"
      return NextResponse.json(
        { success: false, message: data.status },
        { status: 200 } // Send 200 OK so the frontend can handle it
      );
    }
  } catch (error) {
    console.error('Server Geocoding Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}