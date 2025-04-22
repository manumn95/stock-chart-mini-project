
let stockData = {};
// Format timestamp to human-readable dates
function formatTimestamps(timestamps) {
  return timestamps.map((ts) =>
    new Date(ts * 1000).toLocaleDateString()
  );
}

// Render the chart with given stock and range
function renderChart(stock, range) {
  const data = stockData[stock]?.[range];
  if (!data) {
    console.warn(`No data found for ${stock} - ${range}`);
    return;
  }

  const timestamps = formatTimestamps(data.timeStamp);
  const values = data.value;

  const trace = {
    x: timestamps,
    y: values,
    mode: "lines+markers",
    marker: { color: "lime", size: 6 },
    line: { color: "lime", width: 2 },
    hovertemplate: `${stock}: $%{y:.2f}<extra></extra>`,
    type: "scatter",
  };

  const layout = {
    paper_bgcolor: "#0a0931",
    plot_bgcolor: "#0a0931",
    margin: { l: 20, r: 20, t: 20, b: 40 },
    xaxis: {
      showgrid: false,
      visible: false,
    },
    yaxis: {
      showgrid: false,
      visible: false,
    },
    shapes: [],
  };

  const config = { displayModeBar: false };

  Plotly.newPlot("chart", [trace], layout, config);

  const chart = document.getElementById("chart");

  chart.on("plotly_hover", function (data) {
    const xVal = data.points[0].x;
    const hoverDate = document.getElementById("hover-date");
    if (hoverDate) hoverDate.textContent = `Date: ${xVal}`;

    const update = {
      shapes: [
        {
          type: "line",
          x0: xVal,
          x1: xVal,
          y0: 0,
          y1: 1,
          xref: "x",
          yref: "paper",
          line: {
            color: "#fff",
            width: 1,
          },
        },
      ],
    };
    Plotly.relayout("chart", update);
  });

  chart.on("plotly_unhover", function () {
    Plotly.relayout("chart", { shapes: [] });
    const hoverDate = document.getElementById("hover-date");
    if (hoverDate) hoverDate.textContent = "";
  });
}

// Render stock info summary
function chartInfo(ticker, bookValue, profitFormatted, colorClass) {
  const companyName = document.getElementById("name");
  const companyPrice = document.getElementById("price");
  const companyProfit = document.getElementById("profit");

  companyName.textContent = ticker;
  companyPrice.textContent = `$${bookValue.toFixed(3)}`;
  companyProfit.classList.remove("green", "red");
  companyProfit.classList.add(colorClass);
  companyProfit.textContent = `${profitFormatted}%`;
}

// Fetch stock list and initialize display
async function getListData() {
  const request = await fetch(
    "https://stocksapi-uhe1.onrender.com/api/stocks/getstockstatsdata"
  );
  const response = await request.json();
  const tickerStats = response.stocksStatsData[0];
  const profit = (tickerStats.AAPL.profit * 100).toFixed(2);
  let colorClass = profit > 0 ? "green" : "red";

  chartInfo("AAPL", tickerStats.AAPL.bookValue, profit, colorClass);
  renderStockList(tickerStats);
}

// Create ticker stock list in DOM
function renderStockList(data) {
  const stockList = document.querySelector(".stock-list");
  stockList.innerHTML = "";

  const tickers = Object.keys(data).filter((key) => key !== "_id");

  tickers.forEach((ticker) => {
    const { bookValue, profit } = data[ticker];
    const colorClass = profit > 0 ? "green" : "red";
    const profitFormatted = (profit * 100).toFixed(2);

    const stockItem = document.createElement("div");
    stockItem.classList.add("stock");

    const tickerDiv = document.createElement("div");
    tickerDiv.classList.add("ticker");
    tickerDiv.textContent = ticker;

    tickerDiv.addEventListener("click", () => {
      getDescription(ticker);
      init(ticker);
      chartInfo(ticker, bookValue, profitFormatted, colorClass);
    });

    const priceDiv = document.createElement("div");
    priceDiv.classList.add("price");
    priceDiv.textContent = `$${bookValue.toFixed(3)}`;

    const profitDiv = document.createElement("div");
    profitDiv.classList.add(colorClass);
    profitDiv.textContent = `${profitFormatted}%`;

    stockItem.appendChild(tickerDiv);
    stockItem.appendChild(priceDiv);
    stockItem.appendChild(profitDiv);

    stockList.appendChild(stockItem);
  });
}

// Get the company description and update UI
async function getDescription(desc) {
  try {
    const request = await fetch(
      "https://stocksapi-uhe1.onrender.com/api/stocks/getstocksprofiledata"
    );
    const response = await request.json();

    const data = response.stocksProfileData[0];

    if (data && data[desc] && data[desc].summary) {
      const description = data[desc].summary;
      const descriptionEle = document.getElementById("desc");
      descriptionEle.textContent = description;
    } else {
      console.warn(`No summary found for ${desc}`);
    }
  } catch (error) {
    console.error("Error fetching description:", error);
  }
}

// Initialize default chart and attach button listeners
async function init(ticker = "AAPL") {
  try {
    const res = await fetch(
      "https://stocksapi-uhe1.onrender.com/api/stocks/getstocksdata"
    );
    const json = await res.json();
    stockData = json.stocksData[0];

    renderChart(ticker, "1mo");

    const buttons = document.querySelectorAll(".buttons .btn");
    const labelToRange = {
      "1 Month": "1mo",
      "3 Month": "3mo",
      "1 Year": "1y",
      "5 Years": "5y",
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const label = button.textContent.trim();
        const range = labelToRange[label];
        renderChart(ticker, range);
      });
    });
  } catch (err) {
    console.error("Error fetching stock data:", err);
  }
}

// Auto-execute main flow
getListData();
getDescription("AAPL");
init();

// Normal ES module exports
export { init, getListData, getDescription, renderChart };
