export const initialUsers = [
    {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
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
        image_url: 'https://via.placeholder.com/200?text=Calacatta',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Oak Wood Plank',
        category: 'Wood Look',
        size: '8×48',
        purchase_price: 35,
        selling_price: 45,
        stock_qty: 200,
        barcode: 'OW-WL-0848',
        image_url: 'https://via.placeholder.com/200?text=Oak+Wood',
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Concrete Grey Tile',
        category: 'Concrete Look',
        size: '24×24',
        purchase_price: 30,
        selling_price: 42,
        stock_qty: 150,
        barcode: 'CG-CL-2424',
        image_url: 'https://via.placeholder.com/200?text=Concrete',
        created_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Carrara White Polish',
        category: 'Marble Look',
        size: '12×24',
        purchase_price: 45,
        selling_price: 60,
        stock_qty: 80,
        barcode: 'CW-MP-1224',
        image_url: 'https://via.placeholder.com/200?text=Carrara',
        created_at: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Rustic Slate Outdoor',
        category: 'Stone Look',
        size: '16×16',
        purchase_price: 28,
        selling_price: 38,
        stock_qty: 300,
        barcode: 'RS-SL-1616',
        image_url: 'https://via.placeholder.com/200?text=Slate',
        created_at: new Date().toISOString()
    },
    {
        id: 6,
        name: 'Glossy Black Galaxy',
        category: 'Granite Look',
        size: '24×24',
        purchase_price: 55,
        selling_price: 75,
        stock_qty: 50,
        barcode: 'GB-GL-2424',
        image_url: 'https://via.placeholder.com/200?text=Galaxy',
        created_at: new Date().toISOString()
    },
    {
        id: 7,
        name: 'Vintage Pattern Tile',
        category: 'Decorative',
        size: '8×8',
        purchase_price: 25,
        selling_price: 35,
        stock_qty: 120,
        barcode: 'VP-DC-0808',
        image_url: 'https://via.placeholder.com/200?text=Vintage',
        created_at: new Date().toISOString()
    },
    {
        id: 8,
        name: 'Beige Travertine',
        category: 'Stone Look',
        size: '18×18',
        purchase_price: 32,
        selling_price: 48,
        stock_qty: 90,
        barcode: 'BT-SL-1818',
        image_url: 'https://via.placeholder.com/200?text=Travertine',
        created_at: new Date().toISOString()
    },
    {
        id: 9,
        name: 'Walnut Wood Plank',
        category: 'Wood Look',
        size: '6×36',
        purchase_price: 38,
        selling_price: 52,
        stock_qty: 180,
        barcode: 'WW-WL-0636',
        image_url: 'https://via.placeholder.com/200?text=Walnut',
        created_at: new Date().toISOString()
    },
    {
        id: 10,
        name: 'Pure White Nano',
        category: 'Solid Color',
        size: '32×32',
        purchase_price: 60,
        selling_price: 85,
        stock_qty: 40,
        barcode: 'PW-SC-3232',
        image_url: 'https://via.placeholder.com/200?text=Nano+White',
        created_at: new Date().toISOString()
    }
]

export const initialTransfers = []
export const initialTransferItems = []
export const initialReturns = []
export const initialReturnItems = []
export const initialUserTransactions = []

export const initialCategories = [
    { id: 1, name: 'Marble Look', created_at: new Date().toISOString() },
    { id: 2, name: 'Wood Look', created_at: new Date().toISOString() },
    { id: 3, name: 'Concrete Look', created_at: new Date().toISOString() },
    { id: 4, name: 'Stone Look', created_at: new Date().toISOString() },
    { id: 5, name: 'Granite Look', created_at: new Date().toISOString() },
    { id: 6, name: 'Decorative', created_at: new Date().toISOString() },
    { id: 7, name: 'Solid Color', created_at: new Date().toISOString() }
]
