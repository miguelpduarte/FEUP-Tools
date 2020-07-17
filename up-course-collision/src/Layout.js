import React from "react";
import { node } from "prop-types";
import { Row, Col, Typography } from "antd";

const Layout = ({ children }) => (
    <div className="main">
        <Row
            justify="center"
        >
            <Col span={16}>
                <Row gutter={[0, 8]}>
                    <Col span={24}>
                        <Typography.Title>
                            UP Course Collision
                        </Typography.Title>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        {children}
                    </Col>
                </Row>
            </Col>
        </Row>
    </div>
);

Layout.propTypes = {
    children: node,
};

export default Layout;
