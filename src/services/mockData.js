export const initialUsers = [
    {
        id: 1,
        name: 'Admin User',
        mobile: 'admin',
        password: 'admin',
        role: 'ADMIN',
        created_at: new Date().toISOString()
    }
]

export const initialProducts = [
    {
        id: 1,
        name: 'Calacatta Gold Marble',
        category: 'Marble Look',
        size: '24×24',
        purchase_price: 40,
        selling_price: 50,
        stock_qty: 100,
        barcode: 'CG-PM-1224',
        image_url: 'https://via.placeholder.com/200',
        created_at: new Date().toISOString()
    }
]

export const initialTransfers = []
export const initialTransferItems = []
export const initialReturns = []
export const initialReturnItems = []
export const initialUserTransactions = []
