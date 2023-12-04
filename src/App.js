import axios from 'axios';
import './App.css';
import React, { useState, useEffect } from 'react';
import logo from './default_image.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [memberCode, setMemberCode] = useState('');
  const [memberInfo, setMemberInfo] = useState({
    memberCode: '',
    memberName: '',
    totalLiter: 0,
    averageRate: 0,
    totalAmount: 0,
  });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3030/users')
      .then(res => {
        setData(res.data);
        setFilteredData(res.data);
        setTableDates(res.data);
      })
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  const setTableDates = (tableData) => {
    if (tableData.length > 0) {
      // Find the earliest and latest dates in the table
      const dates = tableData.map(user => user.DATE);
      const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));

      setFromDate(sortedDates[0]); // Set the earliest date as 'From' date
      setToDate(sortedDates[sortedDates.length - 1]); // Set the latest date as 'To' date
    }
  };

  const handleMember = () => {
    const memberData = data.filter(user => user.CODE === Number(memberCode));
    setFilteredData(memberData);

    const liters = memberData.reduce((total, user) => total + user.QTY, 0);
    const rates = memberData.map(user => user.RATE);
    const averageRate = rates.length > 0 ? rates.reduce((a, b) => a + b) / rates.length : 0;

    // Get unique member codes and names
    const uniqueMemberCodes = [...new Set(memberData.map(user => user.CODE))];
    const uniqueMemberNames = [...new Set(memberData.map(user => user.NAME))];
    const totalAmount = memberData.reduce((total, user) => total + user.AMOUNT, 0);


    setMemberInfo({
      memberCode: uniqueMemberCodes.join(', '),
      memberName: uniqueMemberNames.join(', '),
      totalLiter: liters.toFixed(2),
      averageRate: averageRate.toFixed(2),
      totalAmount: totalAmount.toFixed(2),

    });
  };

  const rearrangeData = () => {
    const rearrangedData = {};

    filteredData.forEach(item => {
      const { DATE, SHIFT, QTY, RATE, AMOUNT } = item;

      if (!rearrangedData[DATE]) {
        rearrangedData[DATE] = {
          Morning: { QTY: 0, RATE: 0, AMOUNT: 0 },
          Evening: { QTY: 0, RATE: 0, AMOUNT: 0 },
        };
      }

      if (SHIFT === 'M') {
        rearrangedData[DATE].Morning.QTY += QTY;
        rearrangedData[DATE].Morning.RATE += RATE;
        rearrangedData[DATE].Morning.AMOUNT += AMOUNT;
      } else if (SHIFT === 'E') {
        rearrangedData[DATE].Evening.QTY += QTY;
        rearrangedData[DATE].Evening.RATE += RATE;
        rearrangedData[DATE].Evening.AMOUNT += AMOUNT;
      }
    });

    return rearrangedData;
  };

  const rearrangedData = rearrangeData();

  const handleGeneratePDF = () => {
    const input = document.getElementById('pdf-content'); // Change 'pdf-content' to the ID of your table
    if (!input) {
      console.error('Element not found');
      return;
    }

    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const fileName = `Report-${memberCode}-date-${fromDate}-to-${toDate}.pdf`;

      pdf.save(fileName);
    });
  };

  // const handlePrint = () => {
  //   window.print();
  // };

  return (
    <div className="App">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="memberCode">Member Code:</label>
        <input
          type="text"
          id="memberCode"
          value={memberCode}
          onChange={e => setMemberCode(e.target.value)}
        />
        <button onClick={handleMember}>Submit</button>
        {memberInfo.memberCode && (
           <div>
           {/* Button to trigger PDF generation */}
           <button onClick={handleGeneratePDF} style={{backgroundColor:"green"}}>Generate PDF</button>
         </div>
        )}
      </div>


    


      <div id="pdf-content" style={{ padding: "20px" }}>


        <table className="company-details">
          <tbody>
            <tr>
              <td>
                <img src={logo} alt="Company Logo" height={100} width={100} />
              </td>

              <td>
                <p>Company Name: ABC Dairy</p>
                <p>Address: 123 Street, City, Country</p>
              </td>
            </tr>
          </tbody>
        </table>
      


        {memberInfo.memberCode && (
          <div>
            <table>
              <tbody>
                <tr>
                  <td><strong>Member Code : {memberInfo.memberCode}</strong></td>
                  <td><strong>Member Name : {memberInfo.memberName}</strong></td>
                  <td>Bill period from {fromDate} to {toDate}</td>
                </tr>
              </tbody>
            </table>

            <table>
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
              <tbody>
                {Object.keys(rearrangedData).map(date => (
                  <tr key={date}>
                    <td>{date}</td>
                    <td>{rearrangedData[date].Morning.QTY}</td>
                    <td>{rearrangedData[date].Morning.RATE}</td>
                    <td>{rearrangedData[date].Morning.AMOUNT}</td>
                    <td>{rearrangedData[date].Evening.QTY}</td>
                    <td>{rearrangedData[date].Evening.RATE}</td>
                    <td>{rearrangedData[date].Evening.AMOUNT}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table>
              <tbody>

                <tr>
                  <td><strong>Total Liter : {memberInfo.totalLiter}</strong></td>
                  <td><strong>Average Rate : {memberInfo.averageRate}</strong></td>
                  <td><strong>Total Amount : {memberInfo.totalAmount}</strong></td>

                </tr>
              </tbody>
            </table>
           
          </div>
        )}
      </div>
      {/* <div>
        <button onClick={handlePrint}>Print</button>
      </div> */}
    </div>
  );
}

export default App;
