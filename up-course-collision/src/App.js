import React, { useState, useEffect } from "react";
import { Select, Row, Col, Spin, Space, Input, Typography } from "antd";

import "./App.css";
import faculty_data from "./faculty_ids.json";
import urlHelpers from "./urlHelper";
import Layout from "./Layout";

const { Option } = Select;

// TODO: Get from input or make it so that it is always the current year
const schoolYear = 2019;

const App = () => {
    const [selectedFaculty, setSelectedFaculty] = useState();
    const [facultyCoursesLoading, setFacultyCoursesLoading] = useState(false);
    const [facultyCourses, setFacultyCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState();
    const [courseCourseUnitsLoading, setCourseCourseUnitsLoading] = useState(false);
    const [courseCourseUnits, setCourseCourseUnits] = useState([]);
    const [selectedCourseUnits, setSelectedCourseUnits] = useState();

    // Loading faculty's courses for the course dropdown
    useEffect(() => {
        // Prevent fetching on initial mount
        if (!selectedFaculty) {
            return;
        }

        const fetchFacultyCourses = async () => {
            setFacultyCoursesLoading(true);

            const instId = faculty_data[selectedFaculty];
            const url = urlHelpers.FACULTY_COURSES(selectedFaculty, schoolYear, instId);
            const res = await fetch(url);

            const buffer = await res.arrayBuffer();
            const decoder = new TextDecoder("iso-8859-1");
            const text = decoder.decode(buffer);
            const data = JSON.parse(text);
            setFacultyCourses(data.data);
            setFacultyCoursesLoading(false);
        };

        fetchFacultyCourses();
    }, [selectedFaculty]);

    // Loading course's course units
    useEffect(() => {
        // Prevent fetching on initial mount
        if (!selectedCourse) {
            return;
        }

        const fetchCourseCourseUnits = async () => {
            setCourseCourseUnitsLoading(true);

            const res = await fetch(urlHelpers.COURSE_UNITS(selectedFaculty, schoolYear, selectedCourse.id));
            const data = await res.json();

            // Number of pages to load
            const total_n_pages = Math.ceil(data.total / data.tam_pagina);
            // Storing initial data
            let courseUnits = data.resultados;
            // Starting at page two since page one was already loaded
            for (let pageNumber = 2; pageNumber <= total_n_pages; ++pageNumber) {
                const res = await fetch(urlHelpers.COURSE_UNITS(selectedFaculty, schoolYear, selectedCourse.id, pageNumber));
                const data = await res.json();
                courseUnits = [...courseUnits, ...data.resultados];
            }

            setCourseCourseUnits(courseUnits);
            setCourseCourseUnitsLoading(false);
        };

        fetchCourseCourseUnits();
    }, [selectedFaculty, selectedCourse]);

    return (
        <Layout>
            <Row gutter={[8, 8]}>
                <Col span={12}>
                    <Select
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Select a Faculty/School"
                        onChange={(faculty) => {
                            setSelectedFaculty(faculty);
                            // Resetting to prevent unnecessary fetching when faculty changes
                            setSelectedCourse(undefined);
                        }}
                    >
                        {Object.keys(faculty_data).map((faculty_name) => (
                            <Option key={faculty_name} value={faculty_name}>
                                {faculty_name.toUpperCase()}
                            </Option>
                        ))}
                    </Select>
                </Col>
            </Row>
            <Row gutter={[8, 8]}>
                <Col span={12}>
                    <Spin spinning={facultyCoursesLoading}>
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder="Select a Course"
                            value={selectedCourse?.id}
                            onChange={(selectedCourseId) => setSelectedCourse(facultyCourses.find(({ id }) => selectedCourseId === id))}
                            disabled={!facultyCourses.length}
                            optionFilterProp="children"
                            filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        >
                            {facultyCourses.map((course) => (
                                <Option key={course.id} value={course.id}>
                                    {`${course.nome} (${course.sigla})`}
                                </Option>
                            ))}
                        </Select>
                    </Spin>
                </Col>
            </Row>
            <Row gutter={[8, 32]}>
                <Col span={12}>
                    <Spin spinning={courseCourseUnitsLoading}>
                        <Select
                            showSearch
                            mode="multiple"
                            style={{ width: "100%" }}
                            placeholder="Select Course Units"
                            value={selectedCourseUnits}
                            onChange={setSelectedCourseUnits}
                            disabled={!courseCourseUnits.length}
                            optionFilterProp="children"
                            filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        >
                            {courseCourseUnits.map((courseUnit) => (
                                <Option key={courseUnit.ocorr_id} value={courseUnit.ocorr_id}>
                                    {/* TODO: Fix bug:
                                when changing the selectedCourse every previous existing option rerenders and as such "changes course" */}
                                    {`${courseUnit.nome} [${courseUnit.codigo}] (${courseUnit.periodo}) @ ${selectedCourse?.sigla}`}
                                </Option>
                            ))}
                        </Select>
                    </Spin>
                </Col>
            </Row>
            <Row gutter={[8, 8]}>
                <Col span={14}>
                    <Row gutter={[0, 16]}>
                        <Col span={24}>
                            <Space direction="vertical">
                                <Input placeholder="SIGARRA Username" />
                                <Input.Password placeholder="SIGARRA Password" />
                            </Space>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Space size="small" direction="vertical">
                                <Typography.Text>
                                    This data is used due to login being necessary for the next step of the process.
                                </Typography.Text>
                                <Typography.Text>
                                    If you are unsure of what I do with this data, you can&nbsp;
                                    <Typography.Link
                                        href="https://github.com/miguelpduarte/FEUP-Tools/tree/master/up-course-collision"
                                        target="_blank"
                                    >
                                        check the code
                                    </Typography.Link>
                                        &nbsp;(it&apos;s completely open-source).
                                </Typography.Text>
                            </Space>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Layout>
    );
};

export default App;
