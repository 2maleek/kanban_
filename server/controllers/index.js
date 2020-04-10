const {User, Task} = require('../models')
const { compare } = require('../helpers/bcrypt')
const jwt = require('jsonwebtoken')

class Controller {
  static register(req, res, next) {
    let { name, email, password } = req.body
    User.findOne({
      where: { email} 
    })
    .then(isFound => {
      if(!isFound) {
        return User.create({
          name,
          email,
          password
        })
      }
      throw { status: 409, message: 'Email already registered'}
    })
    .then(result => {
      res.status(201).json(result)
    })
    .catch(err => {
      next(err)
    })
  }

  static login(req, res, next) {
    let { email, password } = req.body
    let UserId, name, organization

    User.findOne({
      where: { email }
    })
    .then(isFound => {
      if(isFound) {
        UserId = isFound.id
        name = isFound.name
        organization = isFound.organization
        return compare(password, isFound.password)
      }
      throw { status: 404, message: 'User not registered'}
    })
    .then(result => {
      if(!result){
        throw { status: 400, message: 'Password wrong'}
      }
      let access_token = jwt.sign({
        UserId,
        name,
        email,
        organization,
      }, process.env.SECRET)
      res.status(200).json({access_token, username: name})
    })
    .catch(err => {
      next(err)
    })
  }

  static addTask(req, res, next) {
    let { UserId } = req.user
    let { title, description, category} = req.body

    Task.create({
      title,
      description,
      category,
      UserId
    })
    .then(result => {
      res.status(201).json(result)
    })
    .catch(err => {
      next(err)
    })

  }

  static getTasks(req, res, next) {
    let { organization } = req.user
    Task.findAll({
      include: [
        { 
          model: User,
          where: { organization }
        }
      ]
    })
    .then(result => {
      let data  = []
      result.forEach(element => {
        data.push({
          title: element.title,
          description: element.description,
          category: element.category,
          UserId: element.UserId,
          Creator: element.User.name
        })
      })
      console.log(data[0])
      res.status(200).json(data)
    })
    .catch(err => {
      next(err)
    })
  }

  static getOneTask(req, res, next) {
    let id = req.params.id

    Task.findByPk(id)
    .then(result => {
      res.status(200).json(result)
    })
    .catch(err => {
      next(err)
    })
  }

  static editTask(req, res, next) {
    let id = req.params.id
    let { title, description, category } = req.body

    Task.update({
      title,
      description,
      category
    },
    {
      where: { id }
    })
    .then(() => {
      res.status(200).json({message: 'Update task success'})
    })
    .catch(err => {
      next(err)
    })
  }

  static deleteTask(req, res, next) {
    let id = req.params.id

    Task.destroy({
      where: { id }
    })
    .then(() => {
      res.status(200).json({message: 'Delete task success'})
    })
    .catch(err => {
      next(err)
    })
  }
}

module.exports = Controller