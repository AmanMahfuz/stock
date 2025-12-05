import {
    initialUsers,
    initialProducts,
    initialTransfers,
    initialTransferItems,
    initialReturns,
    initialReturnItems,
    initialUserTransactions
} from './mockData'

const DELAY = 300 // Simulate network delay

class MockBackend {
    constructor() {
        this.init()
    }

    init() {
        // Versioning keys to force reset when schema changes
        if (!localStorage.getItem('db_v2_users')) {
            this.saveData('db_v2_users', initialUsers)
            this.saveData('db_v2_products', initialProducts)
            this.saveData('db_v2_transfers', initialTransfers)
            this.saveData('db_v2_transfer_items', initialTransferItems)
            this.saveData('db_v2_returns', initialReturns)
            this.saveData('db_v2_return_items', initialReturnItems)
            this.saveData('db_v2_user_transactions', initialUserTransactions)
        }
    }

    getData(key) {
        // Map old keys to new versioned keys if needed, or just use new keys
        const versionedKey = key.replace('db_', 'db_v2_')
        return JSON.parse(localStorage.getItem(versionedKey) || '[]')
    }

    saveData(key, data) {
        const versionedKey = key.replace('db_', 'db_v2_')
        localStorage.setItem(versionedKey, JSON.stringify(data))
    }

    async delay() {
        return new Promise(resolve => setTimeout(resolve, DELAY))
    }

    makeToken() {
        return Math.random().toString(36).slice(2)
    }

    // ========================================
    // HELPER LOGIC
    // ========================================

    getStaffStockForProduct(staffId, productId) {
        const transfers = this.getData('db_transfers')
        const transferItems = this.getData('db_transfer_items')
        const returns = this.getData('db_returns')
        const returnItems = this.getData('db_return_items')
        const userTransactions = this.getData('db_user_transactions')

        // Admin -> User (In)
        const receivedQty = transfers
            .filter(t => t.staff_id === parseInt(staffId))
            .flatMap(t => transferItems.filter(ti => ti.transfer_id === t.id))
            .filter(i => i.product_id === parseInt(productId))
            .reduce((sum, i) => sum + i.qty, 0)

        // User -> Warehouse (Out)
        const returnedQty = returns
            .filter(r => r.staff_id === parseInt(staffId))
            .flatMap(r => returnItems.filter(ri => ri.return_id === r.id))
            .filter(i => i.product_id === parseInt(productId))
            .reduce((sum, i) => sum + i.qty, 0)

        // User -> Customer (Out)
        const soldQty = userTransactions
            .filter(t => t.user_id === parseInt(staffId) && t.product_id === parseInt(productId) && t.type === 'TRANSFER')
            .reduce((sum, t) => sum + t.quantity, 0)

        // Customer -> User (In - Return from Job)
        const jobReturnQty = userTransactions
            .filter(t => t.user_id === parseInt(staffId) && t.product_id === parseInt(productId) && t.type === 'JOB_RETURN')
            .reduce((sum, t) => sum + t.quantity, 0)

        return receivedQty - returnedQty - soldQty + jobReturnQty
    }

    getStaffInventory(staffId) {
        const transfers = this.getData('db_transfers')
        const transferItems = this.getData('db_transfer_items')
        const returns = this.getData('db_returns')
        const returnItems = this.getData('db_return_items')
        const userTransactions = this.getData('db_user_transactions')

        const inventory = {}

        // Add transfers
        transferItems.forEach(ti => {
            const transfer = transfers.find(t => t.id === ti.transfer_id)
            if (transfer && transfer.staff_id === staffId) {
                inventory[ti.product_id] = (inventory[ti.product_id] || 0) + ti.qty
            }
        })

        // Subtract returns
        returnItems.forEach(ri => {
            const returnRecord = returns.find(r => r.id === ri.return_id)
            if (returnRecord && returnRecord.staff_id === staffId) {
                inventory[ri.product_id] = (inventory[ri.product_id] || 0) - ri.qty
            }
        })

        // Handle user transactions
        userTransactions.forEach(ut => {
            if (ut.user_id === staffId) {
                if (ut.type === 'TRANSFER') {
                    inventory[ut.product_id] = (inventory[ut.product_id] || 0) - ut.quantity
                } else if (ut.type === 'JOB_RETURN') {
                    inventory[ut.product_id] = (inventory[ut.product_id] || 0) + ut.quantity
                }
            }
        })

        // Clean up zero/negative stock
        Object.keys(inventory).forEach(pid => {
            if (inventory[pid] <= 0) delete inventory[pid]
        })

        return inventory
    }

    // ========================================
    // AUTH
    // ========================================

    async login(identifier, password) {
        await this.delay()
        const users = this.getData('db_users')
        // Check against email
        const user = users.find(u => u.email === identifier && u.password === password)

        if (!user) throw { response: { data: { message: 'Invalid credentials' } } }

        user.token = this.makeToken()
        this.saveData('db_users', users)

        return { token: user.token, role: user.role, id: user.id, name: user.name }
    }

    async signup(data) {
        await this.delay()
        const users = this.getData('db_users')
        if (users.find(u => u.email === data.email)) {
            throw { response: { data: { message: 'User exists' } } }
        }

        const newUser = {
            id: users.length + 1,
            ...data,
            role: data.role || 'USER',
            token: this.makeToken(),
            created_at: new Date().toISOString()
        }

        users.push(newUser)
        this.saveData('db_users', users)

        return { token: newUser.token, role: newUser.role, name: newUser.name, id: newUser.id }
    }

    // ========================================
    // PRODUCTS
    // ========================================

    async getProducts() {
        await this.delay()
        return this.getData('db_products')
    }

    async addProduct(productData) {
        await this.delay()
        const products = this.getData('db_products')
        const newProduct = {
            id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...productData,
            stock_qty: parseInt(productData.stock || productData.stock_qty || 0),
            created_at: new Date().toISOString()
        }
        products.push(newProduct)
        this.saveData('db_products', products)
        return newProduct
    }

    async updateProduct(id, updates) {
        await this.delay()
        const products = this.getData('db_products')
        const idx = products.findIndex(p => p.id === parseInt(id))
        if (idx === -1) throw { response: { data: { message: 'Not found' } } }

        products[idx] = { ...products[idx], ...updates }
        this.saveData('db_products', products)
        return products[idx]
    }

    async deleteProduct(id) {
        await this.delay()
        const products = this.getData('db_products')
        const filtered = products.filter(p => p.id !== parseInt(id))
        this.saveData('db_products', filtered)
        return { success: true }
    }

    // ========================================
    // USERS
    // ========================================

    async getUsers() {
        await this.delay()
        return this.getData('db_users').map(u => ({ id: u.id, name: u.name, role: u.role, email: u.email }))
    }

    // ========================================
    // TRANSFERS (Admin -> User)
    // ========================================

    async createTransfer(data) { // { toUserId, items: [{productId, qty}] }
        await this.delay()
        const products = this.getData('db_products')
        const transfers = this.getData('db_transfers')
        const transferItems = this.getData('db_transfer_items')

        // Validate stock
        for (const item of data.items) {
            const product = products.find(p => p.id === item.productId)
            if (!product) throw { response: { data: { message: `Product ${item.productId} not found` } } }
            if (item.qty > (product.stock_qty || 0)) {
                throw { response: { data: { message: `Insufficient stock for ${product.name}` } } }
            }
        }

        // Process Transfer
        const transferId = transfers.length + 1
        transfers.push({
            id: transferId,
            staff_id: parseInt(data.toUserId),
            created_at: new Date().toISOString()
        })

        data.items.forEach(item => {
            const product = products.find(p => p.id === item.productId)
            product.stock_qty = Math.max(0, (product.stock_qty || 0) - item.qty)

            transferItems.push({
                id: transferItems.length + 1,
                transfer_id: transferId,
                product_id: item.productId,
                qty: item.qty
            })
        })

        this.saveData('db_products', products)
        this.saveData('db_transfers', transfers)
        this.saveData('db_transfer_items', transferItems)

        return { success: true, transferId }
    }

    // ========================================
    // USER TRANSACTIONS (Job Issue / Return)
    // ========================================

    async createUserTransaction(data, currentUser) { // { items, customer_name, type }
        await this.delay()
        const userTransactions = this.getData('db_user_transactions')
        const products = this.getData('db_products')

        if (!data.type || data.type === 'TRANSFER') {
            for (const item of data.items) {
                const available = this.getStaffStockForProduct(currentUser.id, item.productId)
                if (item.qty > available) {
                    const p = products.find(x => x.id === item.productId)
                    throw { response: { data: { message: `Insufficient stock for ${p?.name}. Have: ${available}` } } }
                }
            }
        }

        const newTransactions = data.items.map(item => ({
            id: userTransactions.length + 1 + Math.random(),
            user_id: currentUser.id,
            product_id: item.productId,
            quantity: item.qty,
            type: data.type || 'TRANSFER',
            customer_name: data.customer_name || 'Customer',
            created_at: new Date().toISOString()
        }))

        userTransactions.push(...newTransactions)
        this.saveData('db_user_transactions', userTransactions)

        return { success: true, transactions: newTransactions }
    }

    async getUserTransactions(currentUser) {
        await this.delay()
        const userTransactions = this.getData('db_user_transactions')
        const products = this.getData('db_products')

        return userTransactions
            .filter(ut => ut.user_id === currentUser.id)
            .map(ut => {
                const product = products.find(p => p.id === ut.product_id)
                return {
                    ...ut,
                    product_name: product?.name,
                    product_barcode: product?.barcode
                }
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    // ========================================
    // RETURNS (User -> Warehouse)
    // ========================================

    async createReturn(data, currentUser) { // { items }
        await this.delay()
        const products = this.getData('db_products')
        const returns = this.getData('db_returns')
        const returnItems = this.getData('db_return_items')
        const userTransactions = this.getData('db_user_transactions')

        // Validate
        for (const item of data.items) {
            const available = this.getStaffStockForProduct(currentUser.id, item.productId)
            if (item.qty > available) {
                throw { response: { data: { message: `Cannot return more than you have (${available})` } } }
            }
        }

        const returnId = returns.length + 1
        returns.push({
            id: returnId,
            staff_id: currentUser.id,
            created_at: new Date().toISOString()
        })

        data.items.forEach(item => {
            const product = products.find(p => p.id === item.productId)
            product.stock_qty = (product.stock_qty || 0) + item.qty

            returnItems.push({
                id: returnItems.length + 1,
                return_id: returnId,
                product_id: item.productId,
                qty: item.qty
            })

            userTransactions.push({
                id: userTransactions.length + 1 + Math.random(),
                user_id: currentUser.id,
                product_id: item.productId,
                quantity: item.qty,
                type: 'RETURN',
                created_at: new Date().toISOString()
            })
        })

        this.saveData('db_products', products)
        this.saveData('db_returns', returns)
        this.saveData('db_return_items', returnItems)
        this.saveData('db_user_transactions', userTransactions)

        return { success: true, returnId }
    }

    // ========================================
    // STATS & REPORTS
    // ========================================

    async getStats() {
        await this.delay()
        const products = this.getData('db_products')
        const transfers = this.getData('db_transfers')
        const returns = this.getData('db_returns')

        return {
            totalProducts: products.length,
            totalStock: products.reduce((acc, p) => acc + (Number(p.stock_qty) || 0), 0),
            lowStockCount: products.filter(p => (Number(p.stock_qty) || 0) < 10).length,
            stockValue: products.reduce((acc, p) => acc + ((Number(p.stock_qty) || 0) * (Number(p.selling_price) || 0)), 0),
            pendingReturns: 0,
            recentTransactions: transfers.length + returns.length
        }
    }

    async getUserStats(currentUser) {
        await this.delay()
        const inventory = this.getStaffInventory(currentUser.id)
        const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0)

        return {
            productsTaken: totalItems,
            pendingReturns: 0,
            balanceToReturn: totalItems
        }
    }

    async getStaffInventoryApi(staffId) {
        await this.delay()
        const inventory = this.getStaffInventory(parseInt(staffId))
        const products = this.getData('db_products')

        return Object.entries(inventory).map(([pid, qty]) => {
            const product = products.find(p => p.id === parseInt(pid))
            return {
                product_id: parseInt(pid),
                product,
                quantity: qty
            }
        })
    }

    async getReport(type) {
        await this.delay()
        const products = this.getData('db_products')
        const transfers = this.getData('db_transfers')
        const transferItems = this.getData('db_transfer_items')
        const returns = this.getData('db_returns')
        const returnItems = this.getData('db_return_items')
        const users = this.getData('db_users')

        if (type === 'stock') {
            return products.map(p => {
                const distributed = transferItems.filter(ti => ti.product_id === p.id).reduce((s, i) => s + i.qty, 0)
                const returned = returnItems.filter(ri => ri.product_id === p.id).reduce((s, i) => s + i.qty, 0)
                return {
                    product_id: p.id,
                    product_name: p.name,
                    barcode: p.barcode,
                    stock_qty: p.stock_qty,
                    distributed,
                    returned,
                    in_warehouse: p.stock_qty
                }
            })
        }

        if (type === 'transfers') {
            return transfers.map(t => ({
                transfer_id: t.id,
                staff_name: users.find(u => u.id === t.staff_id)?.name,
                items: transferItems.filter(ti => ti.transfer_id === t.id).map(ti => ({
                    product_name: products.find(p => p.id === ti.product_id)?.name,
                    qty: ti.qty
                })),
                created_at: t.created_at
            }))
        }

        if (type === 'returns') {
            return returns.map(r => ({
                return_id: r.id,
                staff_name: users.find(u => u.id === r.staff_id)?.name,
                items: returnItems.filter(ri => ri.return_id === r.id).map(ri => ({
                    product_name: products.find(p => p.id === ri.product_id)?.name,
                    qty: ri.qty
                })),
                created_at: r.created_at
            }))
        }

        if (type === 'low-stock') {
            return products.filter(p => p.stock_qty < 10)
        }

        return []
    }
}

export const mockBackend = new MockBackend()
