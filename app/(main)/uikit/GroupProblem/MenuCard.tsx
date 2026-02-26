"use client";

import React, { useState } from "react";

export interface MenuCardProps {
  /** ຊື່ໝວດໝູ່ (Category Name) */
  title: string;
  /** ຄຳອະທິບາຍ (Description) */
  description: string;
  /** ຮູບໄອຄອນ (Icon Image URL) */
  iconUrl: string;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  title,
  description,
  iconUrl,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="col-12 md:col-4 p-3">
      <div
        className={`surface-card bg-white border-round-xl cursor-pointer h-full
          flex flex-column align-items-center relative overflow-hidden
          border-1 border-200 ${isHovered ? "shadow-8" : "shadow-2"}`}
        style={{
          minHeight: "380px",
          transform: isHovered ? "translateY(-12px)" : "translateY(0)",
          transition: "transform 300ms ease, box-shadow 300ms ease",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon container — pure white, same size as before */}
        <div
          className="w-full flex align-items-center justify-content-center bg-white border-bottom-1 border-200"
          style={{ height: "160px" }}
        >
          <img
            src={iconUrl}
            alt={title}
            className="relative"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "contain",
              transform: isHovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 300ms ease",
            }}
          />
        </div>

        <div className="flex flex-column flex-grow-1 p-4 text-center mt-2 w-full">
          <span className="text-xl font-bold text-900 mb-3">{title}</span>
          <p className="text-600 line-height-3 text-sm m-0">{description}</p>
        </div>
      </div>
    </div>
  );
};
