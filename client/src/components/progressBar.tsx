import React from "react";

interface PPROPS {
  bgcolor: string;
  completed: number;
  total: number;
}

export const ProgressBar: React.FC<PPROPS> = ({
  bgcolor,
  completed,
  total,
}) => {
  let percentage = 0;
  if (completed / total > 1) {
    percentage = 1;
    bgcolor = "#F87171";
  } else {
    percentage = completed / total;
  }
  /**  In file CSS to ease the functionality of this component. DO NOT do this elsewhere.
       Please either use Tailwind css styling or place complicated styles in index.css */

  const fillerStyles = {
    height: "100%",
    width: `${percentage * 100}%`,
    backgroundColor: bgcolor,
    borderRadius: "inherit",
    textAlign: "right" as const,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: -5,
  } as React.CSSProperties;

  return (
    <div className="bg-white rounded-md text-center text-3xl px-6 py-6 font-bold mt-30 relative z-1">
      <span>{`$${completed} / $${total}`}</span>
      <div style={fillerStyles}></div>
    </div>
  );
};

export default ProgressBar;
