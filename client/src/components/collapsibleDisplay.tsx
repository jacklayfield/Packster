import React, { useState } from "react";
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
    <>
      <div className="w-50 mb-2 shadow-md">
        <div
          className="bg-violet-600 p-4 text-white font-bold text-3xl hover:cursor-pointer"
          onClick={handleOnClick}
        >
          {contents[0]}
        </div>
        {isExpanded && (
          <div className="bg-white p-2 text-black text-2xl ">
            <div className="p-2">
              <Row>
                <Col>
                  <div className="text-center text-3xl">Shashank</div>
                </Col>
                <Col xs={4}>
                  <div className="text-center text-3xl">$72.81</div>
                </Col>
                <Col>
                  <div className="flex flex-col items-center">
                    {" "}
                    <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-3 rounded">
                      Why?
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="h-1 bg-gray-200" />
            <div className="p-2">
              <Row>
                <Col>
                  <div className="text-center text-3xl">Jack</div>
                </Col>
                <Col xs={4}>
                  <div className="text-center text-3xl">$9.97</div>
                </Col>
                <Col>
                  <div className="flex flex-col items-center">
                    {" "}
                    <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-3 rounded">
                      Why?
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="h-1 bg-gray-200" />
            <div className="p-2">
              <Row>
                <Col>
                  <div className="text-center text-3xl">Simon</div>
                </Col>
                <Col xs={4}>
                  <div className="text-center text-3xl">$44.00</div>
                </Col>
                <Col>
                  <div className="flex flex-col items-center">
                    <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-3 rounded">
                      Why?
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="h-1 bg-gray-200" />
            <div className="p-2">
              <Row>
                <Col>
                  <div className="text-center text-3xl">Sarah</div>
                </Col>
                <Col xs={4}>
                  <div className="text-center text-3xl">$84.00</div>
                </Col>
                <Col>
                  <div className="flex flex-col items-center">
                    <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-3 rounded">
                      Why?
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="h-1 bg-gray-200" />
            <div className="p-2">
              <Row>
                <Col>
                  <div className="text-center text-3xl">Megan</div>
                </Col>
                <Col xs={4}>
                  <div className="text-center text-3xl">$64.00</div>
                </Col>
                <Col>
                  <div className="flex flex-col items-center">
                    <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-3 rounded">
                      Why?
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
