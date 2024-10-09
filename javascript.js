const coinSelector = document.getElementById('coinSelector');
const intervalSelector = document.getElementById('intervalSelector');
const ctx = document.getElementById('candlestickChart').getContext('2d');

let chart;
let historicalData = {};
let currentSymbol = 'ethusdt';
let currentInterval = '1m';

// Function to initialize WebSocket connection
function initWebSocket(symbol, interval) {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    const socket = new WebSocket(url);

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const candle = data.k;

        if (candle.x) { // Check if the candle is closed
            const newCandle = {
                t: candle.t,
                o: parseFloat(candle.o),
                h: parseFloat(candle.h),
                l: parseFloat(candle.l),
                c: parseFloat(candle.c),
                v: parseFloat(candle.v),
            };
            updateChart(newCandle);
            saveHistoricalData(symbol, newCandle);
        }
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed.');
    };
}

// Function to update the chart with new candlestick data
function updateChart(candle) {
    const existingData = historicalData[currentSymbol] || [];
    existingData.push(candle);
    historicalData[currentSymbol] = existingData;

    const chartData = existingData.map(c => ({
        x: new Date(c.t),
        y: [c.o, c.h, c.l, c.c],
    }));

    if (chart) {
        chart.data.datasets[0].data = chartData;
        chart.update();
    } else {
        createChart(chartData);
    }
}

// Function to create a new Chart.js instance
function createChart(data) {
    chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: currentSymbol.toUpperCase(),
                data: data,
                borderColor: '#00ff00',
                backgroundColor: '#ff0000',
            }]
        },
        options: {
            scales: {
                x: { type: 'time' },
                y: { beginAtZero: false }
            }
        }
    });
}

// Function to save historical data in local storage
function saveHistoricalData(symbol, newCandle) {
    let data = JSON.parse(localStorage.getItem(symbol)) || [];
    data.push(newCandle);
    localStorage.setItem(symbol, JSON.stringify(data));
}

// Function to load historical data from local storage
function loadHistoricalData(symbol) {
    const data = JSON.parse(localStorage.getItem(symbol)) || [];
    historicalData[symbol] = data;

    if (data.length > 0) {
        const chartData = data.map(c => ({
            x: new Date(c.t),
            y: [c.o, c.h, c.l, c.c],
        }));
        createChart(chartData);
    }
}

// Event listeners for coin and interval selection
coinSelector.addEventListener('change', function() {
    const selectedSymbol = this.value;
    if (selectedSymbol !== currentSymbol) {
        currentSymbol = selectedSymbol;
        loadHistoricalData(currentSymbol);
        initWebSocket(currentSymbol, currentInterval);
    }
});

intervalSelector.addEventListener('change', function() {
    const selectedInterval = this.value;
    if (selectedInterval !== currentInterval) {
        currentInterval = selectedInterval;
        initWebSocket(currentSymbol, currentInterval);
    }
});

// Initial WebSocket connection and data loading
initWebSocket(currentSymbol, currentInterval);
loadHistoricalData(currentSymbol);
