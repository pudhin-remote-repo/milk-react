import React, {useState,useEffect} from 'react';
import * as XLSX from 'xlsx';
import logo from './logo.jpg';
import './App.css'

const ExcelReader = () => {
  const [excelData, setExcelData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showInput, setShowInput] = useState(true); // State to manage input field visibility


  const handleFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryString = event.target.result;
      const workbook = XLSX.read(binaryString, { type: 'binary', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { raw: false });
      setExcelData(data);
      const firstRecord = data[0];
      const lastRecord = data[data.length - 1];
      setFromDate(formatDate(firstRecord.DATE));
      setToDate(formatDate(lastRecord.DATE));
    };
    reader.readAsBinaryString(file);
    setShowInput(false);
  };

  useEffect(() => {
    // console.log('Excel Data:', excelData);
  }, [excelData]);


  const formatDate = (dateString) => {
    const parts = dateString.split(/[-/]/);
    if (parts.length !== 3) {
      return '';
    }

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];

    return `${day}-${month}-${year}`;
  };

  const rearrangeData = (memberData) => {
    const rearrangedData = {};

    memberData.forEach(item => {
      const { DATE, SHIFT, QTY, RATE, AMOUNT } = item;

      const parsedQty = parseFloat(QTY);
      const parsedRate = parseFloat(RATE);
      const parsedAmount = parseFloat(AMOUNT);

      if (!rearrangedData[DATE]) {
        rearrangedData[DATE] = {
          Morning: { QTY: 0, RATE: 0, AMOUNT: 0 },
          Evening: { QTY: 0, RATE: 0, AMOUNT: 0 },
        };
      }

      if (SHIFT === 'M') {
        rearrangedData[DATE].Morning.QTY += parsedQty;
        rearrangedData[DATE].Morning.RATE += parsedRate;
        rearrangedData[DATE].Morning.AMOUNT += parsedAmount;
      } else if (SHIFT === 'E') {
        rearrangedData[DATE].Evening.QTY += parsedQty;
        rearrangedData[DATE].Evening.RATE += parsedRate;
        rearrangedData[DATE].Evening.AMOUNT += parsedAmount;
      }
    });

    return rearrangedData;
  };


  const separateRecordsByMemberCode = (data) => {
    const separatedData = data.reduce((result, item) => {
      const { CODE } = item;
      if (!result[CODE]) {
        result[CODE] = [];
      }
      result[CODE].push(item);
      return result;
    }, {});

    return separatedData;
  };

  const separatedRecords = separateRecordsByMemberCode(excelData);
  const ArrangeData = rearrangeData(excelData);
 
  const generateTableForMember = (memberCode, records) => {
    let totalLiters = 0;
    let totalAmount = 0;
    const ReData = rearrangeData(records);
    console.log("RED",ReData);
    console.log(records);
  
    records.forEach(record => {
      const liters = parseFloat(record.QTY || 0);
      const amount = parseFloat(record.AMOUNT || 0);
  
      totalLiters += liters;
      totalAmount += amount;
    });
  
    const tableHeaders = (
      <thead>
       <tr>
                <th rowSpan="2" style={{ textAlign: 'center' }}>Date</th>
                <th colSpan="3" style={{ textAlign: 'center' }}>Morning</th>
                <th colSpan="3" style={{ textAlign: 'center' }}>Evening</th>
              </tr>
              <tr>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
      </thead>
    );
  
    const tableBody = (
      <tbody>
         {Object.keys(ReData).map(date => (
                <tr key={date}>
                  <td>{formatDate(date)}</td>
                  <td>{ReData[date].Morning.QTY}</td>
                  <td>{ReData[date].Morning.RATE}</td>
                  <td>{ReData[date].Morning.AMOUNT}</td>
                  <td>{ReData[date].Evening.QTY}</td>
                  <td>{ReData[date].Evening.RATE}</td>
                  <td>{ReData[date].Evening.AMOUNT}</td>
                </tr>
              ))}
      </tbody>
    );
  
    return (
      <div key={memberCode} className="member-bill" style={{ pageBreakAfter: 'always' }}>
        {/* <h2>Member Code: {memberCode}</h2> */}
        <table className="company-details">
            <tbody>
              <tr style={{ minHeight: "100px" }}>
                <td>
                  <img src={logo} alt="Company Logo" height={200} width={200} />
                </td>

                <td style={{ textAlign: "center" }}>
                  <h3 style={{ fontWeight: 'bold', fontFamily: 'Times New Roman, serif', fontSize: '26px' }}>SBM Dairy</h3>
                  <p>Near Ration Shop, C.pudur, Sithalangudi Post, Vadipatti Taluk, Madurai - 625 221</p>

                  <p> Phone : 6379480812</p>
                  <p><strong>Bill period From {formatDate(fromDate)} To {formatDate(toDate)}</strong></p>
                </td>
              </tr>
            </tbody>
        </table>
        <table>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}><strong>Member Code : {memberCode}</strong></td>
                <td style={{ textAlign: 'center' }}><strong>Member Name : {records[0].NAME}</strong></td>
              </tr>
            </tbody>
          </table>
        <table className='table table-border' border="1">
          {tableHeaders}
          {tableBody}
        </table>
        <table>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}><strong>Total Liter : {totalLiters.toFixed(2)}</strong></td>
                <td style={{ textAlign: 'center' }}><strong>Average Rate :  {(totalAmount / totalLiters).toFixed(2)}</strong></td>
                <td style={{ textAlign: 'center' }}><strong>Total Amount : {totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <br></br>
          <div style={{ width: '100%' }}>
            <p style={{ borderBottom: '1px solid black' }}></p>
          </div>
      </div>
    );
  };
  
  const memberTables = Object.entries(separatedRecords).map(([memberCode, records]) => {
    return generateTableForMember(memberCode, records);
  });

  // Render tables for each member

  const generatePDF = () => {
    window.print();
  };


  return (
    <div>
 {showInput && ( // Show input field conditionally
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFile} />
      )}      <button className="generate-btn" onClick={generatePDF}>Generate PDF</button>

      <div id="pdf-content">
      {memberTables}

      </div>

    </div>
  );
};

export default ExcelReader;


