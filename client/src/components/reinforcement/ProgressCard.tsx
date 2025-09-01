import React from "react";
import { Card, Typography, Col } from "antd";

export const ProgressCard: React.FC = () => (
  <Col span={24}>
    <Card className="border-none rounded-2xl shadow-lg p-6 text-center bg-white transition-all duration-300 ease-in-out hover:transform hover:-translate-y-1 hover:shadow-xl animate-fade-in">
      <Typography.Title level={3} className="!text-[#1A2A80] !mb-0 text-2xl">
        Progreso
      </Typography.Title>
    </Card>
  </Col>
);