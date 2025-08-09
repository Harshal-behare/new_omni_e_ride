export const salesMonthly = [
  { month: 'Jan', sales: 120, profit: 18 },
  { month: 'Feb', sales: 160, profit: 22 },
  { month: 'Mar', sales: 210, profit: 30 },
  { month: 'Apr', sales: 240, profit: 34 },
  { month: 'May', sales: 300, profit: 42 },
  { month: 'Jun', sales: 280, profit: 38 },
  { month: 'Jul', sales: 320, profit: 45 },
  { month: 'Aug', sales: 340, profit: 48 },
  { month: 'Sep', sales: 290, profit: 40 },
  { month: 'Oct', sales: 360, profit: 52 },
  { month: 'Nov', sales: 400, profit: 58 },
  { month: 'Dec', sales: 440, profit: 62 },
]

export const topModels = [
  { name: 'Urban Pro', units: 510 },
  { name: 'City Rider', units: 420 },
  { name: 'Smart Series', units: 350 },
]

export const dealerKPIs = {
  todayTestRides: 7,
  pendingOrders: 4,
  monthlySales: 9_20_000, // ₹
  inquiries: 26,
}

export const recentOrders = [
  { id: 'OMNI-10041', model: 'Urban Pro', customer: 'A. Sharma', value: 125000, status: 'In Production' },
  { id: 'OMNI-10040', model: 'City Rider', customer: 'R. Kumar', value: 98000, status: 'Shipped' },
  { id: 'OMNI-10039', model: 'Smart Series', customer: 'P. Singh', value: 112000, status: 'Confirmed' },
]

export const testRides = [
  { id: 'TR-2031', model: 'Urban Pro', dealer: 'Green Wheels Patna', date: '2025-08-26', time: '11:00', status: 'Confirmed' },
  { id: 'TR-2030', model: 'City Rider', dealer: 'EcoRide Gaya', date: '2025-08-24', time: '15:30', status: 'Pending' },
]

export const customers = [
  { name: 'Rajesh Kumar', phone: '98765 43210', city: 'Patna', last: '2d ago', status: 'Hot' },
  { name: 'Priya Sharma', phone: '98765 12345', city: 'Gaya', last: '1d ago', status: 'Warm' },
  { name: 'Arjun Patel', phone: '99887 66554', city: 'Bhagalpur', last: '5d ago', status: 'Cold' },
]
