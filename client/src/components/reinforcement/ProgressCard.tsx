import React from "react";
import { Card, Typography, Col } from "antd";


const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const effectiveWidth = 350;
  const effectiveHeight = 250;
  const padding = 20;
  const W = effectiveWidth - padding * 2;
  const H = effectiveHeight - padding * 2;
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * W;
    const y = padding + (1 - v / 100) * H;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(" ");
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="rounded-lg shadow-xl"
    >
      <path d={path} fill="none" stroke="#6366f1" strokeWidth={4} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} fill="#6366f1" />
      ))}
    </svg>
  );
};
export const ProgressCard: React.FC = () => (
  <Col span={24}>
    <Card className="border-none rounded-2xl shadow-xl p-8 bg-white transition-all duration-300 ease-in-out hover:transform hover:-translate-y-2 hover:shadow-2xl">
      <div className="flex flex-col md:flex-row items-center justify-between w-full space-y-6 md:space-y-0 md:space-x-12">
        <div className="flex-1 space-y-4 text-left">
          <Typography.Text className="!text-[#1A2A80] !text-4xl !font-bold leading-tight block mb-4"> 
            Programación
          </Typography.Text>
          <Typography.Text className="!text-[#1A2A80] !text-2xl leading-tight block"> 
            Último examen: 14/08/2025
          </Typography.Text>
          <Typography.Text className="!text-[#1A2A80] !text-2xl leading-tight block">
            Tasa de éxito: 80%
          </Typography.Text>
           <Typography.Text className="!text-[#1A2A80] !text-2xl leading-tight block">
            Nota ultimo examen: 80
          </Typography.Text>
        </div>
        <div className="flex-1 h-64 flex items-center justify-center">
          <Sparkline data={[60, 85, 95, 75, 88, 92, 80, 70, 90, 82, 98, 87]} />
        </div>
      </div>

    </Card>
  </Col>
);