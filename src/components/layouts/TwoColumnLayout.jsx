import React from 'react';

export default function TwoColumnLayout({ left, right }) {
  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}