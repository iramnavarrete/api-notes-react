
const jwt = require('jsonwebtoken')

// middleware to validate token (rutas protegidas)
const verifyToken = (req, res, next) => {
    // console.log(req.headers['authorization'])
    let token = req.headers['authorization']
    
    if (!token) return res.status(401).json({ error: 'No token provided' })
    token = token.replace('Bearer ', '')
    console.log(token)
    try {
        const verified = jwt.verify(token, 'tokenSafe')
        req.user = verified
        next() // continuamos
    } catch (error) {
        res.status(400).json({error: 'token invalid'})
        
    }
}

module.exports = verifyToken