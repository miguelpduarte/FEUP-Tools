import React, { useState, useEffect, useCallback } from "react";
import { Select, Row, Col, Spin, Space, Input, Typography, Button, Table } from "antd";

import "./App.css";
import faculty_data from "./faculty_ids.json";
import urlHelpers from "./urlHelper";
import Layout from "./Layout";

const { Option } = Select;

// TODO: Get from input or make it so that it is always the current year
const schoolYear = 2019;

// Reads: Pick only the elements of arr1 for which there is at least one element in arr2 with the same "codigo"
const intersectStudentArrays = (arr1, arr2) => arr1.filter((el1) => arr2.some((el2) => el1.codigo === el2.codigo));

// TODO: Try catch on fetches and handling when the response cannot be parsed (banhada do sigarra)

const App = () => {
    const [selectedFaculty, setSelectedFaculty] = useState();
    const [facultyCoursesLoading, setFacultyCoursesLoading] = useState(false);
    const [facultyCourses, setFacultyCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState();
    const [courseCourseUnitsLoading, setCourseCourseUnitsLoading] = useState(false);
    const [courseCourseUnits, setCourseCourseUnits] = useState([]);
    const [selectedCourseUnits, setSelectedCourseUnits] = useState();
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [loginAndStudentsLoading, setLoginAndStudentsLoading] = useState(false);
    const [intersectedStudents, setIntersectedStudents] = useState();
    const [error, setError] = useState();

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

    const loginAndFetchStudents = useCallback(async () => {
        setLoginAndStudentsLoading(true);

        // Login
        const loginUrl = urlHelpers.LOGIN(selectedFaculty, username, password);
        const loginRes = await fetch(loginUrl);
        const loginData = await loginRes.json();

        if (loginData.authenticated !== true) {
            setError({
                msg: "Authentication Problem. Most likely wrong username/password",
                sigarra_msg: `${loginData.erro}: ${loginData.erro_msg}`,
            });
            return;
        }

        // Fetch students for each UC (occurence)
        const ucStudents = await Promise.all(selectedCourseUnits.map(async (courseUnitOccurenceId) => {
            const url = urlHelpers.STUDENTS_IN_UC(selectedFaculty, courseUnitOccurenceId);
            const res = await fetch(url);
            const data = await res.json();
            return data;
        }));

        console.log(ucStudents);

        // Merge students
        const intersectedStudents = ucStudents.reduce(intersectStudentArrays);
        setIntersectedStudents(intersectedStudents);

        console.log(intersectedStudents);

        // :D
        setLoginAndStudentsLoading(false);
    }, [password, username, selectedFaculty, selectedCourseUnits]);

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
            <Row gutter={[8, 32]}>
                <Col span={14}>
                    <Row gutter={[0, 16]}>
                        <Col span={24}>
                            <Space direction="vertical">
                                <Input onChange={(e) => setUsername(e.target.value)} placeholder="SIGARRA Username" />
                                <Input.Password onChange={(e) => setPassword(e.target.value)} placeholder="SIGARRA Password" />
                            </Space>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Space size="small" direction="vertical">
                                <Typography.Text>
                                    Login with SIGARRA is necessary for the next step of the process
                                    (fetching students in each course unit).
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
            <Row gutter={[8, 32]}>
                <Col span={12}>
                    <Button
                        type="primary"
                        disabled={!username || !password || !selectedCourseUnits?.length}
                        loading={loginAndStudentsLoading}
                        onClick={loginAndFetchStudents}
                    >
                        Login and fetch students that are in the selected courses
                    </Button>
                </Col>
            </Row>
            {error &&
            <Row>
                <Col span={16}>
                    <Typography.Text type="danger">
                        Error:&nbsp;
                    </Typography.Text>
                    <Typography.Text>
                        {error.msg}
                    </Typography.Text>
                    {error?.sigarra_msg &&
                    <>
                        <br/>
                        <Typography.Text type="warning">
                            SIGARRA says:&nbsp;
                        </Typography.Text>
                        <Typography.Text>
                            {error.sigarra_msg}
                        </Typography.Text>
                    </>}
                </Col>
            </Row>}
            {intersectedStudents?.length &&
            <Table
                rowKey="codigo"
                columns={[
                    { title: "Code", dataIndex: "codigo", sorter: (a, b) => Number(a.codigo) - Number(b.codigo) },
                    { title: "Name", dataIndex: "nome", sorter: (a, b) => a.nome.localeCompare(b.nome) },
                ]}
                dataSource={intersectedStudents}
                title={() => `Students in all of the selected course units (${intersectedStudents.length})`}
            />
            }
        </Layout>
    );
};

export default App;
