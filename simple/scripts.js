// Placeholder for M-Pesa deposit logic
function mpesaDeposit() {
    const amount = parseFloat(document.getElementById('mpesaAmount').value);
    alert(`You deposited ${amount} Ksh via M-Pesa`);
}

// Placeholder for converting Ksh to BTC logic
let kshBalance = 0;
let btcBalance = 0;

document.getElementById('depositForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('mpesaAmount').value);
    kshBalance += amount;
    document.getElementById('kshBalance').textContent = `$${kshBalance.toFixed(2)}`;
});

document.getElementById('convertForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('kshAmount').value);
    if (amount > 0) {
        btcBalance += calculateBtc(amount); // Calculate BTC balance based on conversion rate
        document.getElementById('btcBalance').textContent = `$${btcBalance.toFixed(2)}`;
    }
});

function calculateBtc(kshAmount) {
    // Placeholder for BTC conversion logic
    return kshAmount * 0.00001; // Assuming 1 Bitcoin is worth 1,000,000 Kshs
}

// Placeholder for sending BTC logic
function sendBtc() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    alert(`You sent ${btcBalance} BTC to ${phoneNumber}`);
}

// Initialize balance
document.getElementById('kshBalance').textContent = `$${kshBalance.toFixed(2)}`;
document.getElementById('btcBalance').textContent = `$${btcBalance.toFixed(2)}`;
