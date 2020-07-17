import React, { useState, useEffect } from "react";
import { Select, Row, Col, Spin } from "antd";

import "./App.css";
import faculty_data from "./faculty_ids.json";
import Layout from "./Layout";

const { Option } = Select;

const App = () => {
    const [selectedFaculty, setSelectedFaculty] = useState();
    const [facultyCoursesLoading, setFacultyCoursesLoading] = useState(false);
    const [facultyCourses, setFacultyCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState();
    const [courseCourseUnitsLoading, setCourseCourseUnitsLoading] = useState(false);
    const [courseCourseUnits, setCourseCourseUnits] = useState();

    // Loading faculty's courses for the course dropdown
    useEffect(() => {
        // Prevent fetching on initial mount
        if (!selectedFaculty) {
            return;
        }

        const fetchFacultyCourses = async () => {
            setFacultyCoursesLoading(true);
            // TODO: Get from input
            const schoolYear = 2019;

            const instId = faculty_data[selectedFaculty];
            const res = await fetch(`
/sigarra-api/${selectedFaculty}/pt/cur_lov_geral.get_json_cursos_ga?pv_search_inst_adm=
&pv_search_alect=${schoolYear}
&pv_search_inst_id=${instId}
&pv_search_cod=
&pv_search_nome=
&pv_search_sigla=`);
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
    }, [selectedCourse]);

    return (
        <Layout>
            <Row>
                <Select
                    showSearch
                    style={{ width: "26em" }}
                    placeholder="Select a Faculty/School"
                    onChange={setSelectedFaculty}
                >
                    {Object.keys(faculty_data).map((faculty_name) => (
                        <Option key={faculty_name} value={faculty_name}>
                            {faculty_name.toUpperCase()}
                        </Option>
                    ))}
                </Select>
            </Row>
            <Row>
                <Spin spinning={facultyCoursesLoading}>
                    <Select
                        showSearch
                        style={{ width: "40em" }}
                        placeholder="Select a Course"
                        onChange={setSelectedCourse}
                        disabled={!facultyCourses.length}
                        optionFilterProp="children"
                        filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    >
                        {facultyCourses.map((course) => (
                            <Option key={course.id} value={course.codigo}>
                                {`${course.nome} (${course.sigla})`}
                            </Option>
                        ))}
                    </Select>
                </Spin>
            </Row>
        </Layout>
    );
};

export default App;
