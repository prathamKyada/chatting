const express = require("express")
const app = express()
const cors = require("cors")
const http = require('http').Server(app);
const PORT = 3000
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3001"
    }
});


app.use(cors())
let users = []


socketIO.on('connection', (socket) => {
    console.log(`${socket.id} user just connected!`)  
    socket.on("message", data => {
      socketIO.emit("messageResponse", data)
    })

    socket.on("typing", data => (
      socket.broadcast.emit("typingResponse", data)
    ))

    socket.on("newUser", data => {
      users.push(data)
      socketIO.emit("newUserResponse", users)
      console.log("user > ", users);
    })
 
    socket.on('disconnect', () => {
      console.log('A user disconnected');
      users = users.filter(user => user.socketID !== socket.id)
      socketIO.emit("newUserResponse", users)
      socket.disconnect()
    });
});

// --------------------------- LOGIN SCHEMA  --------------------------- 

const loginSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
});

const login = new mongoose.model("login", loginSchema);

// --------------------------- REGISTRATION SCHEMA  --------------------------- 

const registerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    require: true,
  },
  contactNumber: {
    type: Number,
    require: true,
    unique: true,
  },
  uniqueName: {
    type: String,
    require: true,
    unique: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
});

const register = new mongoose.model("register", registerSchema);


// --------------------------- REGISTRATION API  --------------------------- 

app.post('/register', async (req, res) => {
  const { fullName, contactNumber, uniqueName, email, password } = req.body;
  try {
    const newUser = new register({
      fullName, contactNumber, uniqueName, email, password
    })
    await newUser.save()

    res.status(200).json({ success: true, message: 'Registration Suceesfull' })
  } catch (error) {
    console.error(`Registration error`)
    res.status(400).json({ success: false, message: 'Registration failed' })
  }
})



// --------------------------- LOGIN API  ---------------------------------

app.post('/login', async( req, res) => {
  const { email, password } = req.body;
  try {
    const user = await register.find({ email }) 

    if(!user){
      return res.status(404).json({ success: false, message: 'Email ID not found' })
    }
    const dbPass = user.password;

    if( password !== user.password) {
      res.status(400).json({ success: false, message: 'MisMatching the Password' })
    }

    res.status(200).json({ success: true, message: 'Login successfully'})
  } catch (error) {
    console.error("Error while login > ", error)
    res.status(400).json({ success: false, message: 'Fail to login' })
  }
})

app.get("/api", (req, res) => {
  res.json({message: "Hello"})
});
   
http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});