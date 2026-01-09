import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MobilePortfolioCard from './MobilePortfolioCard';

export default function ResponsiveAssetTable({ assets, columns }) {
  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="text-left py-3 px-3 font-light text-slate-600">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                {columns.map((col, idx) => (
                  <td key={idx} className="py-3 px-3 font-light">
                    {col.render(asset)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {assets.map((asset) => (
          <MobilePortfolioCard key={asset.id} asset={asset} />
        ))}
      </div>
    </>
  );
}