"use client";

import { useState, useEffect } from 'react';

const quotes = [
  "There is something in the New York air that makes sleep useless.",
  "Everybody ought to have a Lower East Side in their life.",
  "New York is not a city, it's a world.",
  "Anytime four New Yorkers get into a cab together without arguing, a bank robbery has just taken place.",
  "I would give the greatest sunset in the world for one sight of New York's skyline.",
  "In New York, you can be a new man.",
  "If you can make it there, you'll make it anywhere; it's up to you, New York, New York.",
  "Real, live, inspiring human energy exists when we coagulate together in crazy places like New York City.",
];

export default function Loading() {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-2xl font-bold mb-4 animate-pulse">Loading...</div>
      <div className="text-lg text-gray-600 italic">&ldquo;{quote}&rdquo;</div>
    </div>
  );
}
