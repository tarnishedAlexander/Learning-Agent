import React from "react";
import { Card, Typography, Row, Col } from "antd";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
}

interface CourseCardsProps {
  courses: Course[];
}

export const CourseCards: React.FC<CourseCardsProps> = ({ courses }) => (
  <Row gutter={[24, 24]} justify="center" className="mt-8">
    {courses.map((course) => (
      <Col xs={24} sm={24} md={12} lg={12} key={course.id}>
        <Link to={`/${course.id}`} className="no-underline">
          <Card className="border-none rounded-2xl shadow-md transition-all duration-200 ease-in-out h-36 flex flex-col justify-center items-center text-center bg-white animate-fade-in hover:shadow-xl hover:-translate-y-1">
            <Typography.Title level={3} className="!text-[#1A2A80] !m-0 text-lg font-medium">
              {course.title}
            </Typography.Title>
            <Typography.Text className="!text-[#7A85C1] mt-2 text-sm">
              {course.description}
            </Typography.Text>
          </Card>
        </Link>
      </Col>
    ))}
  </Row>
);