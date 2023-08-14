import React, { useState } from "react";
import useCollapse from "react-collapsed";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
interface CPROPS {
  contents: String[];
}

export const CollapsibleDisplay: React.FC<CPROPS> = ({ contents }) => {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const handleOnClick = () => {
    setExpanded(!isExpanded);
  };
  return (
    <div className="collapsible">
      <div className="header">
        <Row>
          <Col>
            {" "}
            <button onClick={handleOnClick}>
              {isExpanded ? " (Click to Hide)" : " (Click to Expand)"}
            </button>
          </Col>
          <Col></Col>
          <Col>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {" "}
              {isExpanded ? (
                <i
                  style={{
                    color: "#66ccff",
                  }}
                  className="fa-solid fa-angle-up"
                ></i>
              ) : (
                <i
                  style={{ color: "#66ccff" }}
                  className="fa-solid fa-angle-down"
                ></i>
              )}
            </div>{" "}
          </Col>
        </Row>
      </div>
      {isExpanded && (
        <div>
          <div className="content">
            Example1 <br />
            Example2 <br />
            Example3 <br />
            Example4 <br />
            Example5 <br />
          </div>
        </div>
      )}
    </div>
  );
};
