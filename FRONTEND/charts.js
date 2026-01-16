// async function loadETHChart() {
//   const canvas = document.getElementById("ethChart");

//   if (!canvas) {
//     console.error("Canvas not found!");
//     return;
//   }

//   const ctx = canvas.getContext("2d");

//   const response = await fetch("http://127.0.0.1:5000/predict");
//   const data = await response.json();

//   const labels = [
//     ...data.historical.map(d => d.date),
//     ...data.predicted.map(d => d.date)
//   ];

//   const historicalPrices = data.historical.map(d => d.price);

//   const predictedPrices = [
//     ...new Array(data.historical.length).fill(null),
//     ...data.predicted.map(d => d.price)
//   ];

//   new Chart(ctx, {
//     type: "line",
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "Historical ETH Price",
//           data: historicalPrices,
//           borderColor: "blue",
//           tension: 0.4
//         },
//         {
//           label: "Predicted ETH Price (2026)",
//           data: predictedPrices,
//           borderColor: "purple",
//           borderDash: [6, 6],
//           tension: 0.4
//         }
//       ]
//     }
//   });
// }

// // DOM ready ke baad call
// window.onload = loadETHChart;
