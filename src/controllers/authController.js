const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const asyncHandler = require('../middleware/asyncHandler')
const CustomError = require('../utils/CustomError')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

exports.signup = asyncHandler(async (req, res, next) => {
  const user = await User.create({
    ...req.body,
    avatar: req.file && req.file.buffer
  })

  const token = signToken(user._id)

  res.status(201).json({
    status: 'success',
    token,
    data: user
  })
})

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new CustomError('Please provide email and password', 400)
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.correctPassword(password))) {
    throw new CustomError('Incorrect email or password', 401)
  }

  const token = signToken(user._id)

  res.status(200).json({
    status: 'success',
    token,
    data: user
  })
})

exports.protect = asyncHandler(async (req, res, next) => {
  const token =
    req.headers.authorization &&
    req.headers.authorization.replace('Bearer ', '')

  if (!token) throw new CustomError('Authentication failed!', 401)

  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  req.userData = { userId: decoded.id }
  next()
})